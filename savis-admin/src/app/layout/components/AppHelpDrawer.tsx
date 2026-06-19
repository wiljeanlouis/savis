import catalogProductFlowsMarkdown from "@/content/catalog-product-flows.md?raw";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { BookOpenTextIcon, HelpCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AppHelpDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Ouvrir l'aide SAVIS"
        >
          <span>Aide</span>
          <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
        </Button>
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-[min(calc(100vw-1rem),84rem)] data-[side=right]:sm:max-w-7xl">
        <SheetHeader className="border-b pr-14">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={BookOpenTextIcon} strokeWidth={2} />
            </div>
            <div>
              <SheetTitle>Aide SAVIS</SheetTitle>
              <SheetDescription>
                Guide métier destiné aux admins.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-4 text-sm text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:mt-0 [&_h2]:mt-8 [&_h3]:mt-6 [&_h4]:mt-5 [&_li>p]:my-0 [&_ol]:my-3 [&_p]:leading-6 [&_table_code]:whitespace-nowrap [&_ul]:my-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-semibold text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="pt-3 text-lg font-semibold text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="pt-2 text-base font-semibold text-foreground">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="pt-1 text-sm font-semibold text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-muted-foreground">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                a: ({ children, href }) => (
                  <a
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                    href={href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="my-4 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground [&_code]:bg-transparent [&_code]:p-0">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-hidden rounded-md border">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                        {children}
                      </table>
                    </div>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted text-foreground">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border-b px-3 py-2 font-medium">{children}</th>
                ),
                tr: ({ children }) => (
                  <tr className="border-b last:border-b-0">{children}</tr>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {children}
                  </td>
                ),
              }}
            >
              {catalogProductFlowsMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
