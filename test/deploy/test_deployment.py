"""Run the real deployment script with isolated command doubles, never production."""
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import unittest.mock

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('safety', ROOT / 'deploy/scripts/deployment-safety.py')
SAFETY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SAFETY)

# Command doubles log no arguments (the actual CLI URL contains a secret).
DOUBLE = r'''#!/usr/bin/env python3
import os, sys
from pathlib import Path
name = Path(sys.argv[0]).name
args = sys.argv[1:]
log = Path(os.environ['CALL_LOG'])
if name == 'sleep': sys.exit(0)
if name == 'df':
    print('Filesystem 1024-blocks Used Available Capacity Mounted on\nfake 99999999 0 99999999 0% /')
    sys.exit(0)
if name in ('curl', 'systemctl'): sys.exit(0)
if name == 'npx':
    assert args[:5] == ['--yes', 'supabase@3.0.0', 'db', 'push', '--remote=' + os.environ['SUPABASE_DB_URL']]
    assert '--yes' in args[5:] and '--include-all' not in args and '--skip-vault' in args
    dry = '--dry-run' in args
    with log.open('a') as f: f.write('supabase-plan\n' if dry else 'supabase-apply\n')
    print('postgresql://postgres:TOPSECRET@host/db TOPSECRET service-secret')
    if os.environ.get('FAIL') == ('supabase-dry-run' if dry else 'supabase'): sys.exit(12)
    sys.exit(0)
if name != 'docker': sys.exit(0)
if args[0] == 'inspect':
    service = args[-1]
    if os.environ.get('HEALTH') == 'inspect-error' and service == 'backend_api': sys.exit(4)
    if 'Health.Status' in args[2]:
        mode = os.environ.get('HEALTH', '')
        result = 'healthy'
        if service == 'backend_api':
            if mode == 'missing-health': result = 'missing'
            if mode == 'unhealthy': result = 'unhealthy'
            if mode == 'recover':
                state = Path(os.environ['CALL_LOG'] + '.health')
                result = 'healthy' if state.exists() else 'unhealthy'
                state.touch()
        print(result)
    elif 'State.Status' in args[2]:
        print('exited' if os.environ.get('HEALTH') == 'exited' and service == 'backend_api' else 'running')
    sys.exit(0)
if args[0] == 'buildx': sys.exit(0)
assert args[0] == 'compose'
if args == ['compose', 'version']: sys.exit(0)
args = args[args.index('-f') + 2:]
cmd = args[0]
if cmd == 'ps':
    if '-aq' in args:
        service = args[-1]
        if not (os.environ.get('HEALTH') == 'absent' and service == 'backend_api'):
            print(service)
    sys.exit(0)
if cmd == 'exec':
    if os.environ.get('FAIL') == 'postgres-backup':
        print('TOPSECRET postgresql://secret@host/db', file=sys.stderr)
        sys.exit(14)
    print('fake-dump')
    sys.exit(0)
if cmd in ('logs',):
    print('postgresql://postgres:TOPSECRET@host/db TOPSECRET service-secret')
    sys.exit(0)
if cmd == 'run':
    service = args[-1]
    with log.open('a') as f: f.write(service + '\n')
    if os.environ.get('FAIL') == service:
        print('TOPSECRET postgresql://secret@host/db')
        sys.exit(13)
if cmd == 'up':
    with log.open('a') as f: f.write('up ' + ' '.join(args[1:]) + '\n')
sys.exit(0)
'''


class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.release = self.root / 'release'
        self.release.mkdir()
        shutil.copytree(ROOT / 'deploy', self.release / 'deploy')
        shutil.copytree(ROOT / 'supabase/migrations', self.release / 'supabase/migrations')
        shutil.copy(ROOT / 'docker-compose.prod.yml', self.release)
        self.manifest = self.release / 'release.env'
        self.manifest.write_text('SAVIS_VERSION=v2.0.0\n' + '\n'.join(
            f'SAVIS_{kind}_IMAGE=ghcr.io/wiljeanlouis/savis-{image}@sha256:' + 'a' * 64
            for kind, image in [('API', 'api'), ('ADMIN', 'admin'), ('EXECUTOR', 'executor')]) + '\n')
        self.envfile = self.root / 'prod.env'
        self.envfile.write_text('DB_USER=savis\nDB_PASSWORD=TOPSECRET\nDB_NAME=savis\nSUPABASE_SERVICE_ROLE_KEY=service-secret\n')
        self.deploy = self.root / 'deployment'
        self.deploy.mkdir()
        self.old = self.root / 'old-release'
        self.old.mkdir()
        (self.deploy / 'current').symlink_to(self.old)
        (self.deploy / 'current-version').write_text('v1.0.0\n')
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        for command in ['docker', 'npx', 'systemctl', 'curl', 'df', 'sleep', 'flock']:
            path = self.bin / command
            path.write_text(DOUBLE)
            path.chmod(0o755)
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ['PATH'],
                        SAVIS_ENV_FILE=str(self.envfile), SAVIS_DEPLOY_ROOT=str(self.deploy),
                        CALL_LOG=str(self.root / 'calls'), SUPABASE_ENABLED='true',
                        SUPABASE_DB_URL='postgresql://postgres:TOPSECRET@host/db',
                        SAVIS_HEALTH_TIMEOUT_SECONDS='1', SAVIS_HEALTH_POLL_SECONDS='1')
        self.env.pop('SAVIS_MIGRATIONS_APPROVED_FOR', None)
        self.env.pop('SUPABASE_BACKUP_VERIFIED_FOR', None)
        self.env.pop('SUPABASE_BACKUP_REFERENCE', None)

    def run_deploy(self, **changes):
        self.env.update(changes)
        result = subprocess.run(['bash', str(self.release / 'deploy/scripts/deploy-production.sh'), str(self.release)],
                                env=self.env, capture_output=True, text=True, timeout=60)
        self.assertNotIn('TOPSECRET', result.stdout + result.stderr)
        self.assertNotIn('service-secret', result.stdout + result.stderr)
        calls = self.root / 'calls'
        return result, calls.read_text() if calls.exists() else ''

    def assert_preserved(self):
        self.assertEqual((self.deploy / 'current').resolve(), self.old)
        self.assertEqual((self.deploy / 'current-version').read_text(), 'v1.0.0\n')

    def test_success_and_order(self):
        result, calls = self.run_deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        ordered = ['up -d postgres rabbitmq', 'supabase-plan', 'supabase-apply', 'backend_migrate',
                   'executor_migrate', 'up -d --no-deps backend_api executor_api',
                   'up -d --no-deps executor_worker executor_beat frontend_admin']
        self.assertEqual(sorted(ordered, key=calls.index), ordered)
        self.assertEqual((self.deploy / 'current').resolve(), self.release)
        self.assertEqual((self.deploy / 'current-version').read_text(), 'v2.0.0\n')
        self.assertTrue(list((self.deploy / 'backups').glob('*.dump')))

    def test_supabase_disabled(self):
        result, calls = self.run_deploy(SUPABASE_ENABLED='false', SUPABASE_DB_URL='')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn('supabase', calls)

    def test_supabase_dry_run_failure_stops_before_apply(self):
        result, calls = self.run_deploy(FAIL='supabase-dry-run')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('supabase-plan', calls)
        self.assertNotIn('supabase-apply', calls)
        self.assertNotIn('migrate', calls)
        self.assert_preserved()

    def test_postgres_backup_failure_stops_before_migrations(self):
        result, calls = self.run_deploy(FAIL='postgres-backup')
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('supabase-plan', calls)
        self.assertNotIn('migrate', calls)
        self.assert_preserved()

    def test_migration_failures_stop_before_replacement(self):
        for service in ['supabase', 'backend_migrate', 'executor_migrate']:
            with self.subTest(service=service):
                result, calls = self.run_deploy(FAIL=service)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('supabase-apply' if service == 'supabase' else service, calls)
                self.assertNotIn('up -d --no-deps backend_api', calls)
                self.assert_preserved()
                (self.root / 'calls').unlink()

    def test_temporary_unhealthy_recovers(self):
        result, _ = self.run_deploy(HEALTH='recover', SAVIS_HEALTH_TIMEOUT_SECONDS='5')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_health_failures_preserve_release(self):
        for health in ['absent', 'missing-health', 'inspect-error', 'unhealthy', 'exited']:
            with self.subTest(health=health):
                result, _ = self.run_deploy(HEALTH=health)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('application-replacement', result.stderr)
                self.assert_preserved()

    def test_potentially_destructive_sql_is_warning_only(self):
        (self.release / 'supabase/migrations/20990101000000_drop.sql').write_text('drop table customer_orders;')
        result, calls = self.run_deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('WARNING: potential destructive SQL operation in 20990101000000_drop.sql', result.stdout)
        self.assertIn('20990101000000_drop.sql', result.stdout)
        self.assertIn('supabase-plan', calls)
        self.assertIn('supabase-apply', calls)
        self.assertIn('backend_migrate', calls)
        self.assertIn('executor_migrate', calls)

    def test_redaction(self):
        with unittest.mock.patch.dict(os.environ, {'DB_PASSWORD': 'some:complex/password'}):
            self.assertNotIn('some', SAFETY.redact('some:complex/password some%3Acomplex%2Fpassword'))


if __name__ == '__main__':
    unittest.main()
