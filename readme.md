# yapper

Yapper is a highly opinionated CLI tool that lets you generate structured APIs, modules, and production-ready Express + Mongoose setups instantly. 

It handles all the boilerplate of setting up an production grade Express.js application and allows you to easily generate new API modules (controllers, services, routes, and schemas) with a single command.

## Installation

Install `yapper` globally via npm to use its commands from anywhere:

```bash
npm install -g yapper
```

## Usage

### 1. Create a New Project

To generate a new, fully configured Express + Mongoose project, use the `yapper` command:

```bash
yapper <project-name>
```

This will create a new folder named `<project-name>` containing:
- A structured Express app with best practices
- Centralized error handling and standardized API responses
- Pre-configured `logger` and `dotenv`
- A MongoDB connection setup using Mongoose
- Typescript support and standard configurations (`tsconfig.json`, `package.json`, etc.)

Once generated, navigate into your new project, check dependencies, and start the dev server:
```bash
cd <project-name>
npm run dev
```

### 2. Generate a New Module

To add a new API module to your project, use the `yapp` command from within your project's root directory:

```bash
yapp <module-name>
```

For example, running `yapp user` will automatically generate the following files:
- `src/schemas/user.schema.ts`
- `src/services/user.service.ts`
- `src/controllers/user.controller.ts`
- `src/routes/user.route.ts`

These files come pre-filled with standard CRUD boilerplate, completely hooked up and ready to be imported into your main application.


----
### Contributing

Contributions, ideas, and improvements are welcome.

Open an issue or submit a PR.

- Connect With Me

Suggestions are welcome.

- Email: anshumanprof01@gmail.com

- Blog

[https://anshumancdx.xyz/blog](https://anshumancdx.xyz/blog)

- Newsletter

[https://newsletter.anshumancdx.xyz/](https://newsletter.anshumancdx.xyz/)

### Support the Project

If you find this useful, consider giving the repo a star at

[https://github.com/anshumancodes/yapper](https://github.com/anshumancodes/yapper)