# Changelog

## [1.4.1](https://github.com/wiljeanlouis/savis/compare/v1.4.0...v1.4.1) (2026-06-19)


### Bug Fixes

* add options to executor_worker for improved Celery performance ([#53](https://github.com/wiljeanlouis/savis/issues/53)) ([33a4da4](https://github.com/wiljeanlouis/savis/commit/33a4da41590db91a18a749d3fcab55e47114ad86))

## [1.4.0](https://github.com/wiljeanlouis/savis/compare/v1.3.1...v1.4.0) (2026-06-19)


### Features

* enhance documentation and add help features for SAVIS Admin ([#51](https://github.com/wiljeanlouis/savis/issues/51)) ([0db3380](https://github.com/wiljeanlouis/savis/commit/0db3380d886840b152d3d0234d1bfb24d6583dd4))

## [1.3.1](https://github.com/wiljeanlouis/savis/compare/v1.3.0...v1.3.1) (2026-06-16)


### Bug Fixes

* Update Dependabot configuration for multiple ecosystems ([#45](https://github.com/wiljeanlouis/savis/issues/45)) ([bfaa7ce](https://github.com/wiljeanlouis/savis/commit/bfaa7cef15940e10636513ea68bf948f3b952a06))

## [1.3.0](https://github.com/wiljeanlouis/savis/compare/v1.2.1...v1.3.0) (2026-06-16)


### Features

* add smoke test ([#44](https://github.com/wiljeanlouis/savis/issues/44)) ([7f1fe97](https://github.com/wiljeanlouis/savis/commit/7f1fe977da788059aa491e3bcbbb5518f96b99a7))
* Enhance Dependabot config for multiple ecosystems ([#8](https://github.com/wiljeanlouis/savis/issues/8)) ([8d101fc](https://github.com/wiljeanlouis/savis/commit/8d101fcb05dbee1d1ced1e9d753d91506ee9ba2f))

## [1.2.1](https://github.com/wiljeanlouis/savis/compare/v1.2.0...v1.2.1) (2026-06-15)


### Bug Fixes

* add conditional checks for non-release pull requests in CI jobs ([c48cb3c](https://github.com/wiljeanlouis/savis/commit/c48cb3cca3f62c3b1071b189e1b3403c81e3d1e0))
* add health checks for executor services and improve error logging ([#5](https://github.com/wiljeanlouis/savis/issues/5)) ([f4480fc](https://github.com/wiljeanlouis/savis/commit/f4480fc8b671974a6a3c27cc61b6b2e976b8ee1d))
* update CI workflow triggers and clarify README instructions ([7e467c7](https://github.com/wiljeanlouis/savis/commit/7e467c7e4f633ac9504831dfa2e2d277490d50ea))

## [1.2.0](https://github.com/wiljeanlouis/savis/compare/v1.1.0...v1.2.0) (2026-06-15)


### Features

* add activity-rate management and update BOM cost calculations ([7655c05](https://github.com/wiljeanlouis/savis/commit/7655c053c2877e93b7c4947025470611e9433d0e))
* add BOM type selection to BomForm and update related hooks and tests ([a5618ec](https://github.com/wiljeanlouis/savis/commit/a5618ec9cdfba55b53d812fc47626979c9bce82c))
* add Carousel component with navigation and context support ([7c6e972](https://github.com/wiljeanlouis/savis/commit/7c6e972710fdc3974124f45d6650ceefa32d46b9))
* add delete offer functionality and corresponding tests ([7cac972](https://github.com/wiljeanlouis/savis/commit/7cac9724abcae43ed301de02e33d3af3d4529ee6))
* add Docker Compose configuration for scraper services ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* Add Docker support and health checks for savis-api and savis-executor ([26e3eb8](https://github.com/wiljeanlouis/savis/commit/26e3eb86b55338685e29924f8c28abb7874cf52c))
* add ingredient list sorting and search term facets components ([6005723](https://github.com/wiljeanlouis/savis/commit/60057236c0356acb3e6b4e905ae3acbd22149a6b))
* Add Makefile for simplified Docker commands and environment management ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* add offer search functionality and integrate with IngredientInput component ([63aab9a](https://github.com/wiljeanlouis/savis/commit/63aab9ab41dca991c58485b3abd225b484e65a7f))
* add offer type handling and update ingredient references in API and components ([624b02f](https://github.com/wiljeanlouis/savis/commit/624b02fcb3dca480479ccff396ac8fc93e082d04))
* add offers and tasks management features ([80a1cd5](https://github.com/wiljeanlouis/savis/commit/80a1cd5b975d495d5112752938ffff67731a2105))
* add release automation with Release Please configuration and manifest files ([d2de3d8](https://github.com/wiljeanlouis/savis/commit/d2de3d82f43f911d2984f24a300591f95bf6e1e3))
* add scraping task repository and related ports ([f4793c6](https://github.com/wiljeanlouis/savis/commit/f4793c61c6a2414d7eea8c19eb6d3dca485863eb))
* add sorting functionality for tasks and offers with pagination ([e5c2a60](https://github.com/wiljeanlouis/savis/commit/e5c2a609365b0d1286c12efd251b7d9d67d3e901))
* add the scraper service ([f78d199](https://github.com/wiljeanlouis/savis/commit/f78d19997ea224a7da0b6c3aca5e6eda07859f5e))
* add UI components and configuration for SAVIS admin ([70bc1f0](https://github.com/wiljeanlouis/savis/commit/70bc1f02ef0e6271c03fdf25271d86bab86604eb))
* adjust padding in PictureFrame component for improved layout ([5032ef6](https://github.com/wiljeanlouis/savis/commit/5032ef628af5c6cba35ea8c002ce182494b6e834))
* enhance architecture and documentation for catalog management, including product and category handling, pricing analysis, and API updates ([561edd9](https://github.com/wiljeanlouis/savis/commit/561edd95264f08722133d3db64c4c4f0a39a2221))
* enhance database schema creation and update engine options for PostgreSQL ([3a41ad0](https://github.com/wiljeanlouis/savis/commit/3a41ad0dfc8fba58cb3f2f4a783c872228d47b1d))
* enhance Docker configurations and update API integration for improved development workflow ([c740dde](https://github.com/wiljeanlouis/savis/commit/c740dde10da696273b5c79504e06f7fd291b424c))
* enhance Docker setup with smoke tests and environment variables for API URLs ([f666db4](https://github.com/wiljeanlouis/savis/commit/f666db4183525d99598ce56fcd6325603f803a2e))
* enhance error handling in RecipeForm and RecipeList components, add NoData component for empty states ([e43a175](https://github.com/wiljeanlouis/savis/commit/e43a175a978adccba0af0efe5881f17ab95d65dd))
* enhance Maxi scraper and extractor with new offer handling and price refresh functionality ([386bd0c](https://github.com/wiljeanlouis/savis/commit/386bd0c5b0b3a0438ae3679109eb13f9fd208280))
* enhance MaxiOffer to derive total price and add unit tests for price calculations ([3f97159](https://github.com/wiljeanlouis/savis/commit/3f971591b56d7ec63dcd58fdbc1cdc65fa8a2838))
* enhance offer repository with new methods for refreshing and searching offers ([3a30d7c](https://github.com/wiljeanlouis/savis/commit/3a30d7cfa745fa29e6d9982e310da7f8f8a6b5e9))
* Enhance recipe and BOM pricing functionality ([b65bf78](https://github.com/wiljeanlouis/savis/commit/b65bf78a118a6cc6a78bdd29bad419f7bc56c716))
* Enhance recipe and money management with new properties, methods, and tests; update application configuration ([7213626](https://github.com/wiljeanlouis/savis/commit/721362626e8361e6fc1a983f4bdf3b1fffc81920))
* enhance sidebar navigation with collapsible menus and update BOM references ([b6557b1](https://github.com/wiljeanlouis/savis/commit/b6557b158c20cd9607d25310e70722555af2030b))
* implement activity rate management ([99c79aa](https://github.com/wiljeanlouis/savis/commit/99c79aaff0e3682dee133fa61ee4588a7b2f4a99))
* implement cleanup use case and background runner for stale scraping tasks ([e91de6b](https://github.com/wiljeanlouis/savis/commit/e91de6b51265ffc9bdbfc2747eaca249df7346ad))
* implement IngredientNeededEventPort and its adapter for event publishing ([f789800](https://github.com/wiljeanlouis/savis/commit/f78980037eccdd881a80d94a188bca22094a8020))
* implement Maxi product details and list extraction, including parsing and model definitions ([f4f05b2](https://github.com/wiljeanlouis/savis/commit/f4f05b2dff92173c6112604a3f3247412e11635d))
* implement offer management features including patching and invalidation ([1bfec13](https://github.com/wiljeanlouis/savis/commit/1bfec13e85319844774a01dfc8eb2610e762493a))
* implement offer management system with messaging and persistence layers ([00f7a48](https://github.com/wiljeanlouis/savis/commit/00f7a48f4dc7de8116866c4aef7a82b520230a13))
* implement pagination for task listing and update related schemas and tests ([ee8dbbc](https://github.com/wiljeanlouis/savis/commit/ee8dbbc4a995f3501c0438d3854ddbfba8f5cc24))
* Implement product pricing and catalog management services ([878d7d3](https://github.com/wiljeanlouis/savis/commit/878d7d3d813031cc0deb84d147d126e16edbf29e))
* implement provider access policy with circuit breaker and request pacing ([467c27b](https://github.com/wiljeanlouis/savis/commit/467c27ba4aebe988dc472e024068458d7eeee023))
* Implement RabbitMQ integration for asynchronous scraping tasks ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* implement recipe activities management and update API endpoints ([4c27d26](https://github.com/wiljeanlouis/savis/commit/4c27d266df027527ee645209afcf6f3ba8d59660))
* Implement recipe deletion functionality and update repository interface ([6fbd51f](https://github.com/wiljeanlouis/savis/commit/6fbd51f143bb1ad144d4cb9130a7ccfeaa0a0dfc))
* implement recipe management with event publishing and persistence ([77ce4a8](https://github.com/wiljeanlouis/savis/commit/77ce4a82091276fdabd30fcc3df1476bedccce6a))
* implement recipe search functionality and update RecipeList component ([26b45c1](https://github.com/wiljeanlouis/savis/commit/26b45c16069e387b5664e4118ff46fceed4287e2))
* implement RecipePersistenceException and handler for improved error management ([0dd3400](https://github.com/wiljeanlouis/savis/commit/0dd3400b1301b81a16a077395a3a81ba4589e5f0))
* implement scraping task management and enhance API routes ([878003c](https://github.com/wiljeanlouis/savis/commit/878003cd12fe0e92baea210a5c49482e5ac62d47))
* implement tracked offers management and remove Flower dependency ([67625dd](https://github.com/wiljeanlouis/savis/commit/67625dd4387b9137cdb1a88a1c593e76b100f1cf))
* implement use case structure for scraping ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* Initialize Savis API project with basic structure and recipe management ([18a6d12](https://github.com/wiljeanlouis/savis/commit/18a6d125373c4683e47efc40f49e22cd8cf73fb5))
* integrate Supabase configuration and enhance local development setup ([9a21f35](https://github.com/wiljeanlouis/savis/commit/9a21f352f59c5efd9ca42bf595ad3d72cefa3cd4))
* Introduce BOM (Bill of Materials) domain and service ([cb402ee](https://github.com/wiljeanlouis/savis/commit/cb402eee8c6967787b2367d264e71d5c95988773))
* Introduce Quantity and Unit classes for ingredient measurement ([d825957](https://github.com/wiljeanlouis/savis/commit/d8259573c87282691f4ba981d8e3b20640c592e8))
* refactor Activity and BOM components to remove unused fields and streamline data handling ([4eacd1c](https://github.com/wiljeanlouis/savis/commit/4eacd1c98b901e44d8cac5b3b495bfa5a659a609))
* refactor BOM and activity persistence layers, remove unused mappers, and update unit handling ([f6f33b2](https://github.com/wiljeanlouis/savis/commit/f6f33b266668d718a9572e41521bbe518f14dd65))
* refactor Bom class to remove id field and update related mappings and tests ([94a6979](https://github.com/wiljeanlouis/savis/commit/94a697935aba26dd8621651c3a3d951b9a16beea))
* refactor BOM component, task management with new API, components, and routing ([c15fa3f](https://github.com/wiljeanlouis/savis/commit/c15fa3f7c16e70cd628bf9146de6e3519437d30e))
* Refactor recipe form and ingredient input components ([834c20c](https://github.com/wiljeanlouis/savis/commit/834c20c9c274bece630ae6034ae4828fbf2f0c51))
* refactor recipe management by updating command structures, enhancing ingredient handling, and improving API responses ([a1d850f](https://github.com/wiljeanlouis/savis/commit/a1d850f2fd90096d54855bca848c99107688efb9))
* Refactor recipe management to include cooking and preparation minutes, and implement listing functionality ([8c67475](https://github.com/wiljeanlouis/savis/commit/8c674751fa4b7adf5891762ff7dfe8276e853db3))
* refactor recipe model and related components to use 'name' instead of 'title', and introduce PictureFrame component for image handling ([e7768e9](https://github.com/wiljeanlouis/savis/commit/e7768e91e74e116d52cdd22ee501d27455295b3e))
* refactor RecipeCommand and Recipe classes to use Minute for time representation, enhance ingredient handling, and update related tests ([2cfdaac](https://github.com/wiljeanlouis/savis/commit/2cfdaacc4e4b16f74fec552d76f4d521a06ae6ef))
* refactor scraper architecture and enhance API integration ([5a19355](https://github.com/wiljeanlouis/savis/commit/5a19355869f4b179c7cc63523aacd2c38b3a3d40))
* refactor sidebar navigation components to improve routing and active state handling ([6d71da6](https://github.com/wiljeanlouis/savis/commit/6d71da608ef93660d53e9e94899804521e6d0d78))
* remove refresh_now parameter from ingredient and offer APIs, update related logic and tests ([85cdfe3](https://github.com/wiljeanlouis/savis/commit/85cdfe3625198b4b9c0463c5d99c272b584b0f24))
* remove timezone configuration from Celery app and add tests for tracked offer use case ([46d0678](https://github.com/wiljeanlouis/savis/commit/46d0678f522cb8ba12aed6dfffe7251d6c94bc92))
* remove unused import and refactor build_search_url to use PROVIDER_IDENTIFIER ([4be7440](https://github.com/wiljeanlouis/savis/commit/4be7440e52e990335d020e439c86f11fcfefcd06))
* rename offer to ingredient in savis-admin ([f82c88f](https://github.com/wiljeanlouis/savis/commit/f82c88f9630dfbbd24a1e6c4b60a1e82ac3e938c))
* rename UUID to publicId in Recipe model and related components, update service methods for consistency ([fe8e0b3](https://github.com/wiljeanlouis/savis/commit/fe8e0b303e14f32646886947ad6038b442275e77))
* replace Java API publisher with RabbitMQ publisher for scraping results ([eda8df2](https://github.com/wiljeanlouis/savis/commit/eda8df2012a4cfadf8ddcc07852f3397ece7100b))
* simplify RecipeCard and RecipeListHeader components by removing unused props and imports ([b6eb5b2](https://github.com/wiljeanlouis/savis/commit/b6eb5b23df926d014f5b29e54fcc72a8d0de72d6))
* standardize unit values in IngredientInput and RecipeForm components ([8e439d0](https://github.com/wiljeanlouis/savis/commit/8e439d0453f104eca5c17a912b01de1673799877))
* update .gitignore to exclude log, coverage, dist, and build directories ([18c1785](https://github.com/wiljeanlouis/savis/commit/18c1785a390dafc5b3914d802d3e2bbbb3d99cf0))
* update architecture and documentation to reflect new scheduling and offer refresh logic ([5f4f9ae](https://github.com/wiljeanlouis/savis/commit/5f4f9ae105c60fd15ddd4c4c5b634f5edfbec97c))
* update Docker configurations for backend, frontend, and scraper services ([753caf9](https://github.com/wiljeanlouis/savis/commit/753caf9533070634d371e0af09be1109b5b20195))
* update documentation to reflect BOM terminology and structure changes across architecture, API, and admin UI ([5f11b36](https://github.com/wiljeanlouis/savis/commit/5f11b366aa200fb13a061e00ebbf9fb3b1db7218))
* update Header and AppRouter components to improve breadcrumb handling and add RecipePage route ([d5cc2fb](https://github.com/wiljeanlouis/savis/commit/d5cc2fb3cad8fe471844771f88bcef6211d1a939))
* update Java version to 25 and adjust related configurations in Dockerfile and .gitignore ([20e00e6](https://github.com/wiljeanlouis/savis/commit/20e00e6177009e001414c247b8103e104efd38a4))


### Bug Fixes

* enhance release workflow with input for existing release tag and update README instructions ([#3](https://github.com/wiljeanlouis/savis/issues/3)) ([e19f3f6](https://github.com/wiljeanlouis/savis/commit/e19f3f6d025228fd493776ff2bcd11d6d7fa52a1))
* improve scraping logic and error handling ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* refactor RecipeForm to handle form submission correctly ([18c1785](https://github.com/wiljeanlouis/savis/commit/18c1785a390dafc5b3914d802d3e2bbbb3d99cf0))
* Update docker-compose.yml to use environment variables for database and RabbitMQ credentials ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* update Dockerfile for scraper ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* update installation instructions for Chrome and user services in README files ([b331d17](https://github.com/wiljeanlouis/savis/commit/b331d17d6f55d55ae95d82334a2a66d2459e9c43))
* update RabbitMQ publisher documentation and improve message properties ([8af956f](https://github.com/wiljeanlouis/savis/commit/8af956fd78895138b883f02b663b1fedf1cbee1d))
* update Spring Boot version to 4.0.7 and add null check for mode in Product validation ([a7228e2](https://github.com/wiljeanlouis/savis/commit/a7228e24001fbe7f02e7feb5a5eaa66a3a30fa49))

## [1.1.0](https://github.com/wiljeanlouis/savis/compare/savis-v1.0.1...savis-v1.1.0) (2026-06-15)


### Features

* add activity-rate management and update BOM cost calculations ([7655c05](https://github.com/wiljeanlouis/savis/commit/7655c053c2877e93b7c4947025470611e9433d0e))
* add BOM type selection to BomForm and update related hooks and tests ([a5618ec](https://github.com/wiljeanlouis/savis/commit/a5618ec9cdfba55b53d812fc47626979c9bce82c))
* add Carousel component with navigation and context support ([7c6e972](https://github.com/wiljeanlouis/savis/commit/7c6e972710fdc3974124f45d6650ceefa32d46b9))
* add delete offer functionality and corresponding tests ([7cac972](https://github.com/wiljeanlouis/savis/commit/7cac9724abcae43ed301de02e33d3af3d4529ee6))
* add Docker Compose configuration for scraper services ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* Add Docker support and health checks for savis-api and savis-executor ([26e3eb8](https://github.com/wiljeanlouis/savis/commit/26e3eb86b55338685e29924f8c28abb7874cf52c))
* add ingredient list sorting and search term facets components ([6005723](https://github.com/wiljeanlouis/savis/commit/60057236c0356acb3e6b4e905ae3acbd22149a6b))
* Add Makefile for simplified Docker commands and environment management ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* add offer search functionality and integrate with IngredientInput component ([63aab9a](https://github.com/wiljeanlouis/savis/commit/63aab9ab41dca991c58485b3abd225b484e65a7f))
* add offer type handling and update ingredient references in API and components ([624b02f](https://github.com/wiljeanlouis/savis/commit/624b02fcb3dca480479ccff396ac8fc93e082d04))
* add offers and tasks management features ([80a1cd5](https://github.com/wiljeanlouis/savis/commit/80a1cd5b975d495d5112752938ffff67731a2105))
* add release automation with Release Please configuration and manifest files ([d2de3d8](https://github.com/wiljeanlouis/savis/commit/d2de3d82f43f911d2984f24a300591f95bf6e1e3))
* add scraping task repository and related ports ([f4793c6](https://github.com/wiljeanlouis/savis/commit/f4793c61c6a2414d7eea8c19eb6d3dca485863eb))
* add sorting functionality for tasks and offers with pagination ([e5c2a60](https://github.com/wiljeanlouis/savis/commit/e5c2a609365b0d1286c12efd251b7d9d67d3e901))
* add the scraper service ([f78d199](https://github.com/wiljeanlouis/savis/commit/f78d19997ea224a7da0b6c3aca5e6eda07859f5e))
* add UI components and configuration for SAVIS admin ([70bc1f0](https://github.com/wiljeanlouis/savis/commit/70bc1f02ef0e6271c03fdf25271d86bab86604eb))
* adjust padding in PictureFrame component for improved layout ([5032ef6](https://github.com/wiljeanlouis/savis/commit/5032ef628af5c6cba35ea8c002ce182494b6e834))
* enhance architecture and documentation for catalog management, including product and category handling, pricing analysis, and API updates ([561edd9](https://github.com/wiljeanlouis/savis/commit/561edd95264f08722133d3db64c4c4f0a39a2221))
* enhance database schema creation and update engine options for PostgreSQL ([3a41ad0](https://github.com/wiljeanlouis/savis/commit/3a41ad0dfc8fba58cb3f2f4a783c872228d47b1d))
* enhance Docker configurations and update API integration for improved development workflow ([c740dde](https://github.com/wiljeanlouis/savis/commit/c740dde10da696273b5c79504e06f7fd291b424c))
* enhance Docker setup with smoke tests and environment variables for API URLs ([f666db4](https://github.com/wiljeanlouis/savis/commit/f666db4183525d99598ce56fcd6325603f803a2e))
* enhance error handling in RecipeForm and RecipeList components, add NoData component for empty states ([e43a175](https://github.com/wiljeanlouis/savis/commit/e43a175a978adccba0af0efe5881f17ab95d65dd))
* enhance Maxi scraper and extractor with new offer handling and price refresh functionality ([386bd0c](https://github.com/wiljeanlouis/savis/commit/386bd0c5b0b3a0438ae3679109eb13f9fd208280))
* enhance MaxiOffer to derive total price and add unit tests for price calculations ([3f97159](https://github.com/wiljeanlouis/savis/commit/3f971591b56d7ec63dcd58fdbc1cdc65fa8a2838))
* enhance offer repository with new methods for refreshing and searching offers ([3a30d7c](https://github.com/wiljeanlouis/savis/commit/3a30d7cfa745fa29e6d9982e310da7f8f8a6b5e9))
* Enhance recipe and BOM pricing functionality ([b65bf78](https://github.com/wiljeanlouis/savis/commit/b65bf78a118a6cc6a78bdd29bad419f7bc56c716))
* Enhance recipe and money management with new properties, methods, and tests; update application configuration ([7213626](https://github.com/wiljeanlouis/savis/commit/721362626e8361e6fc1a983f4bdf3b1fffc81920))
* enhance sidebar navigation with collapsible menus and update BOM references ([b6557b1](https://github.com/wiljeanlouis/savis/commit/b6557b158c20cd9607d25310e70722555af2030b))
* implement activity rate management ([99c79aa](https://github.com/wiljeanlouis/savis/commit/99c79aaff0e3682dee133fa61ee4588a7b2f4a99))
* implement cleanup use case and background runner for stale scraping tasks ([e91de6b](https://github.com/wiljeanlouis/savis/commit/e91de6b51265ffc9bdbfc2747eaca249df7346ad))
* implement IngredientNeededEventPort and its adapter for event publishing ([f789800](https://github.com/wiljeanlouis/savis/commit/f78980037eccdd881a80d94a188bca22094a8020))
* implement Maxi product details and list extraction, including parsing and model definitions ([f4f05b2](https://github.com/wiljeanlouis/savis/commit/f4f05b2dff92173c6112604a3f3247412e11635d))
* implement offer management features including patching and invalidation ([1bfec13](https://github.com/wiljeanlouis/savis/commit/1bfec13e85319844774a01dfc8eb2610e762493a))
* implement offer management system with messaging and persistence layers ([00f7a48](https://github.com/wiljeanlouis/savis/commit/00f7a48f4dc7de8116866c4aef7a82b520230a13))
* implement pagination for task listing and update related schemas and tests ([ee8dbbc](https://github.com/wiljeanlouis/savis/commit/ee8dbbc4a995f3501c0438d3854ddbfba8f5cc24))
* Implement product pricing and catalog management services ([878d7d3](https://github.com/wiljeanlouis/savis/commit/878d7d3d813031cc0deb84d147d126e16edbf29e))
* implement provider access policy with circuit breaker and request pacing ([467c27b](https://github.com/wiljeanlouis/savis/commit/467c27ba4aebe988dc472e024068458d7eeee023))
* Implement RabbitMQ integration for asynchronous scraping tasks ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* implement recipe activities management and update API endpoints ([4c27d26](https://github.com/wiljeanlouis/savis/commit/4c27d266df027527ee645209afcf6f3ba8d59660))
* Implement recipe deletion functionality and update repository interface ([6fbd51f](https://github.com/wiljeanlouis/savis/commit/6fbd51f143bb1ad144d4cb9130a7ccfeaa0a0dfc))
* implement recipe management with event publishing and persistence ([77ce4a8](https://github.com/wiljeanlouis/savis/commit/77ce4a82091276fdabd30fcc3df1476bedccce6a))
* implement recipe search functionality and update RecipeList component ([26b45c1](https://github.com/wiljeanlouis/savis/commit/26b45c16069e387b5664e4118ff46fceed4287e2))
* implement RecipePersistenceException and handler for improved error management ([0dd3400](https://github.com/wiljeanlouis/savis/commit/0dd3400b1301b81a16a077395a3a81ba4589e5f0))
* implement scraping task management and enhance API routes ([878003c](https://github.com/wiljeanlouis/savis/commit/878003cd12fe0e92baea210a5c49482e5ac62d47))
* implement tracked offers management and remove Flower dependency ([67625dd](https://github.com/wiljeanlouis/savis/commit/67625dd4387b9137cdb1a88a1c593e76b100f1cf))
* implement use case structure for scraping ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* Initialize Savis API project with basic structure and recipe management ([18a6d12](https://github.com/wiljeanlouis/savis/commit/18a6d125373c4683e47efc40f49e22cd8cf73fb5))
* integrate Supabase configuration and enhance local development setup ([9a21f35](https://github.com/wiljeanlouis/savis/commit/9a21f352f59c5efd9ca42bf595ad3d72cefa3cd4))
* Introduce BOM (Bill of Materials) domain and service ([cb402ee](https://github.com/wiljeanlouis/savis/commit/cb402eee8c6967787b2367d264e71d5c95988773))
* Introduce Quantity and Unit classes for ingredient measurement ([d825957](https://github.com/wiljeanlouis/savis/commit/d8259573c87282691f4ba981d8e3b20640c592e8))
* refactor Activity and BOM components to remove unused fields and streamline data handling ([4eacd1c](https://github.com/wiljeanlouis/savis/commit/4eacd1c98b901e44d8cac5b3b495bfa5a659a609))
* refactor BOM and activity persistence layers, remove unused mappers, and update unit handling ([f6f33b2](https://github.com/wiljeanlouis/savis/commit/f6f33b266668d718a9572e41521bbe518f14dd65))
* refactor Bom class to remove id field and update related mappings and tests ([94a6979](https://github.com/wiljeanlouis/savis/commit/94a697935aba26dd8621651c3a3d951b9a16beea))
* refactor BOM component, task management with new API, components, and routing ([c15fa3f](https://github.com/wiljeanlouis/savis/commit/c15fa3f7c16e70cd628bf9146de6e3519437d30e))
* Refactor recipe form and ingredient input components ([834c20c](https://github.com/wiljeanlouis/savis/commit/834c20c9c274bece630ae6034ae4828fbf2f0c51))
* refactor recipe management by updating command structures, enhancing ingredient handling, and improving API responses ([a1d850f](https://github.com/wiljeanlouis/savis/commit/a1d850f2fd90096d54855bca848c99107688efb9))
* Refactor recipe management to include cooking and preparation minutes, and implement listing functionality ([8c67475](https://github.com/wiljeanlouis/savis/commit/8c674751fa4b7adf5891762ff7dfe8276e853db3))
* refactor recipe model and related components to use 'name' instead of 'title', and introduce PictureFrame component for image handling ([e7768e9](https://github.com/wiljeanlouis/savis/commit/e7768e91e74e116d52cdd22ee501d27455295b3e))
* refactor RecipeCommand and Recipe classes to use Minute for time representation, enhance ingredient handling, and update related tests ([2cfdaac](https://github.com/wiljeanlouis/savis/commit/2cfdaacc4e4b16f74fec552d76f4d521a06ae6ef))
* refactor scraper architecture and enhance API integration ([5a19355](https://github.com/wiljeanlouis/savis/commit/5a19355869f4b179c7cc63523aacd2c38b3a3d40))
* refactor sidebar navigation components to improve routing and active state handling ([6d71da6](https://github.com/wiljeanlouis/savis/commit/6d71da608ef93660d53e9e94899804521e6d0d78))
* remove refresh_now parameter from ingredient and offer APIs, update related logic and tests ([85cdfe3](https://github.com/wiljeanlouis/savis/commit/85cdfe3625198b4b9c0463c5d99c272b584b0f24))
* remove timezone configuration from Celery app and add tests for tracked offer use case ([46d0678](https://github.com/wiljeanlouis/savis/commit/46d0678f522cb8ba12aed6dfffe7251d6c94bc92))
* remove unused import and refactor build_search_url to use PROVIDER_IDENTIFIER ([4be7440](https://github.com/wiljeanlouis/savis/commit/4be7440e52e990335d020e439c86f11fcfefcd06))
* rename offer to ingredient in savis-admin ([f82c88f](https://github.com/wiljeanlouis/savis/commit/f82c88f9630dfbbd24a1e6c4b60a1e82ac3e938c))
* rename UUID to publicId in Recipe model and related components, update service methods for consistency ([fe8e0b3](https://github.com/wiljeanlouis/savis/commit/fe8e0b303e14f32646886947ad6038b442275e77))
* replace Java API publisher with RabbitMQ publisher for scraping results ([eda8df2](https://github.com/wiljeanlouis/savis/commit/eda8df2012a4cfadf8ddcc07852f3397ece7100b))
* simplify RecipeCard and RecipeListHeader components by removing unused props and imports ([b6eb5b2](https://github.com/wiljeanlouis/savis/commit/b6eb5b23df926d014f5b29e54fcc72a8d0de72d6))
* standardize unit values in IngredientInput and RecipeForm components ([8e439d0](https://github.com/wiljeanlouis/savis/commit/8e439d0453f104eca5c17a912b01de1673799877))
* update .gitignore to exclude log, coverage, dist, and build directories ([18c1785](https://github.com/wiljeanlouis/savis/commit/18c1785a390dafc5b3914d802d3e2bbbb3d99cf0))
* update architecture and documentation to reflect new scheduling and offer refresh logic ([5f4f9ae](https://github.com/wiljeanlouis/savis/commit/5f4f9ae105c60fd15ddd4c4c5b634f5edfbec97c))
* update Docker configurations for backend, frontend, and scraper services ([753caf9](https://github.com/wiljeanlouis/savis/commit/753caf9533070634d371e0af09be1109b5b20195))
* update documentation to reflect BOM terminology and structure changes across architecture, API, and admin UI ([5f11b36](https://github.com/wiljeanlouis/savis/commit/5f11b366aa200fb13a061e00ebbf9fb3b1db7218))
* update Header and AppRouter components to improve breadcrumb handling and add RecipePage route ([d5cc2fb](https://github.com/wiljeanlouis/savis/commit/d5cc2fb3cad8fe471844771f88bcef6211d1a939))
* update Java version to 25 and adjust related configurations in Dockerfile and .gitignore ([20e00e6](https://github.com/wiljeanlouis/savis/commit/20e00e6177009e001414c247b8103e104efd38a4))


### Bug Fixes

* improve scraping logic and error handling ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* refactor RecipeForm to handle form submission correctly ([18c1785](https://github.com/wiljeanlouis/savis/commit/18c1785a390dafc5b3914d802d3e2bbbb3d99cf0))
* Update docker-compose.yml to use environment variables for database and RabbitMQ credentials ([036a150](https://github.com/wiljeanlouis/savis/commit/036a15055247ad6eb7bb58ac0c0bceac3262c412))
* update Dockerfile for scraper ([246246d](https://github.com/wiljeanlouis/savis/commit/246246d1f175d42795675978e0bc347f58a69c55))
* update installation instructions for Chrome and user services in README files ([b331d17](https://github.com/wiljeanlouis/savis/commit/b331d17d6f55d55ae95d82334a2a66d2459e9c43))
* update RabbitMQ publisher documentation and improve message properties ([8af956f](https://github.com/wiljeanlouis/savis/commit/8af956fd78895138b883f02b663b1fedf1cbee1d))
* update Spring Boot version to 4.0.7 and add null check for mode in Product validation ([a7228e2](https://github.com/wiljeanlouis/savis/commit/a7228e24001fbe7f02e7feb5a5eaa66a3a30fa49))
