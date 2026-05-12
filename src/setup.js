#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helpers

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✔ created  ${path.relative(process.cwd(), filePath)}`);
}

// Templates
const tplLogger = () => `import { format } from 'date-fns';

const ts = () => format(new Date(), 'yyyy-MM-dd HH:mm:ss');

export const logger = {
  info:  (...args: unknown[]) => console.log (\`[INFO  \${ts()}]\`, ...args),
  error: (...args: unknown[]) => console.error(\`[ERROR \${ts()}]\`, ...args),
  warn:  (...args: unknown[]) => console.warn (\`[WARN  \${ts()}]\`, ...args),
  debug: (...args: unknown[]) => console.debug(\`[DEBUG \${ts()}]\`, ...args),
};

export default logger;
`;

const tplMiddlewareResponse = () => `import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      success: (data: unknown, message?: string, statusCode?: number) => void;
      failure: (message: string, statusCode?: number, errors?: unknown[]) => void;
    }
  }
}

export function responseMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.success = (data: unknown, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({ success: true, statusCode, message, data });
  };

  res.failure = (message = 'Something went wrong', statusCode = 500, errors: unknown[] = []) => {
    res.status(statusCode).json({ success: false, statusCode, message, errors });
  };

  next();
}
`;

const tplMiddlewareError = () => `import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../error.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors ?? [],
      code: err.code,
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal Server Error',
    errors: [],
  });
}
`;

const tplMiddlewareRequest = () => `import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();
  const ts = new Date().toISOString();

  console.log(\`[\${ts}] --> \${req.method} \${req.originalUrl} (id=\${requestId})\`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      \`[\${new Date().toISOString()}] <-- \${req.method} \${req.originalUrl} \${res.statusCode} \${duration}ms (id=\${requestId})\`
    );
  });

  next();
}
`;

const tplApiError = () => `export class ApiError extends Error {
  statusCode: number;
  success: false = false;
  errors: unknown[];
  code?: string;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors: unknown[] = [],
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
`;

const tplApiResponse = () => `export class ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
`;

const tplEnv = () => `import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV:    process.env.NODE_ENV    ?? 'development',
  PORT:        Number(process.env.PORT ?? 3000),
  MONGO_URI:   process.env.MONGO_URI   ?? 'mongodb://localhost:27017/myapp',
  JWT_SECRET:  process.env.JWT_SECRET  ?? 'change_me',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
} as const;
`;

const tplApp = () => `import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { requestLogger } from './common/middlewares/request.js';
import { responseMiddleware } from './common/middlewares/response.js';
import { errorHandler } from './common/middlewares/error.js';

const app = express();

//Core middlewares
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

//Custom middlewares
app.use(requestLogger);
app.use(responseMiddleware);

// Routes 
// import userRouter from './routes/user.route.js';
// app.use('/api/v1/user', userRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
`;

const tplServer = (projectName) => `import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import logger from './common/logger/index.js';

const start = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected');

    app.listen(env.PORT, () => {
      logger.info(\`${projectName} running on http://localhost:\${env.PORT} [\${env.NODE_ENV}]\`);
    });
  } catch (err) {
    logger.error('Startup error:', err);
    process.exit(1);
  }
};

start();
`;

const tplTsConfig = () => `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

const tplEnvFile = (projectName) => `NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/${projectName}
JWT_SECRET=supersecretkey
CORS_ORIGIN=*
`;

const tplPackageJson = (projectName) => JSON.stringify({
  name: projectName,
  version: '1.0.0',
  description: `${projectName} — generated by yapper`,
  main: 'dist/server.js',
  type: 'module',
  scripts: {
    dev:   'nodemon --exec ts-node src/server.ts',
    build: 'tsc',
    start: 'node dist/server.js',
  },
  dependencies: {
    express:        '^4.18.2',
    mongoose:       '^8.0.0',
    dotenv:         '^16.0.0',
    cors:           '^2.8.5',
    'cookie-parser': '^1.4.6',
    uuid:           '^9.0.0',
    'date-fns':     '^3.0.0',
  },
  devDependencies: {
    typescript:              '^5.0.0',
    '@types/express':        '^4.17.21',
    '@types/cors':           '^2.8.17',
    '@types/cookie-parser':  '^1.4.6',
    '@types/node':           '^20.0.0',
    '@types/uuid':           '^9.0.0',
    'ts-node':               '^10.9.2',
    nodemon:                 '^3.0.0',
  },
}, null, 2);

const tplGitignore = () => `node_modules/
dist/
.env
*.log
`;

// Docker templates 

const tplDockerfile = (projectName) => `# Stage 1: build
FROM node:20-alpine AS builder
LABEL org.opencontainers.image.title="${projectName}"

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: production 
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
`;

const tplDockerIgnore = () => `node_modules/
dist/
.env
*.log
.git
.gitignore
README.md
`;

const tplDockerCompose = (projectName) => `version: '3.9'

services:
  app:
    build:
      context: .
      target: production
    container_name: ${projectName}_app
    restart: unless-stopped
    ports:
      - '\${PORT:-3000}:3000'
    env_file:
      - .env
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - ${projectName}_net

  mongo:
    image: mongo:7
    container_name: ${projectName}_mongo
    restart: unless-stopped
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${projectName}_net

volumes:
  mongo_data:

networks:
  ${projectName}_net:
    driver: bridge
`;

// Prettier template

const tplPrettierRc = () => `{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
`;

const tplPrettierIgnore = () => `node_modules/
dist/
*.min.js
*.min.css
`;

// Generator functions 

/*
  Writes Dockerfile, .dockerignore, and docker-compose.yml into the project root.
  @param {string} root  - Absolute path to the project root directory.
  @param {string} projectName - Name of the project (used in image labels & service names).
 */
function generateDockerSetup(root, projectName) {
  console.log('\n🐳 Setting up Docker…\n');
  write(path.join(root, 'Dockerfile'),         tplDockerfile(projectName));
  write(path.join(root, '.dockerignore'),      tplDockerIgnore());
  write(path.join(root, 'docker-compose.yml'), tplDockerCompose(projectName));
  console.log('  ✔ Docker setup complete');
}

/*
  Writes .prettierrc and .prettierignore, then patches package.json to add
 prettier as a devDependency and a "format" npm script.
 @param {string} root  - Absolute path to the project root directory.
 */
function generatePrettierSetup(root) {
  console.log('\n✨ Setting up Prettier…\n');
  write(path.join(root, '.prettierrc'),      tplPrettierRc());
  write(path.join(root, '.prettierignore'), tplPrettierIgnore());

  // Patch the already-written package.json to include prettier
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  pkg.scripts = pkg.scripts ?? {};
  pkg.scripts.format = 'prettier --write "src/**/*.{ts,js,json}"';
  pkg.scripts['format:check'] = 'prettier --check "src/**/*.{ts,js,json}"';

  pkg.devDependencies = pkg.devDependencies ?? {};
  pkg.devDependencies['prettier'] = '^3.2.5';

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log('  ✔ Prettier setup complete  (package.json updated)');
}

//Readme template

const tplReadme = (projectName) => `# ${projectName}

> Generated by [yapper](https://github.com/anshumancodes/yapper) 

Yapper is a highly opinionated CLI tool that lets you generate structured APIs, modules, and production-ready Express + Mongoose setups instantly. 

It handles all the boilerplate of setting up an production grade Express.js application and allows you to easily generate new API modules (controllers, services, routes, and schemas) with a single command.

## Getting Started

\`\`\`bash
npm install
cp .env.example .env   # edit values
npm run dev
\`\`\`

## Folder Structure

\`\`\`
src/
├── common/
│    ├── logger/           # Centralized logger
│    ├── middlewares/
│    │    ├── request.ts   # Request logging + requestId
│    │    ├── response.ts  # res.success() / res.failure()
│    │    └── error.ts     # ApiError handler
│    ├── error.ts          # ApiError class
│    └── response.ts       # ApiResponse class
├── controllers/
├── routes/
├── services/
├── schemas/
├── config/
│    └── env.ts
├── app.ts
└── server.ts
\`\`\`

## Add a new module

\`\`\`bash
yapp <name>
\`\`\`

Generates: \`schemas/<name>.schema.ts\`, \`services/<name>.service.ts\`, \`controllers/<name>.controller.ts\`, \`routes/<name>.route.ts\`
`;

// main

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: yapper <projectname>');
  process.exit(1);
}

const root = path.resolve(projectName);

if (fs.existsSync(root)) {
  console.error(`Error: folder "${projectName}" already exists.`);
  process.exit(1);
}

console.log(`\n [![node](https://skillicons.dev/icons?i=nodejs,figma&theme=light)](https://skillicons.dev) Creating project: ${projectName}\n`);

const src = path.join(root, 'src');

// Scaffold file / utils that will be useful for devs

write(path.join(src, 'common', 'logger', 'index.ts'),             tplLogger());
write(path.join(src, 'common', 'middlewares', 'response.ts'),      tplMiddlewareResponse());
write(path.join(src, 'common', 'middlewares', 'error.ts'),         tplMiddlewareError());
write(path.join(src, 'common', 'middlewares', 'request.ts'),       tplMiddlewareRequest());
write(path.join(src, 'common', 'error.ts'),                        tplApiError());
write(path.join(src, 'common', 'response.ts'),                     tplApiResponse());
write(path.join(src, 'config', 'env.ts'),                          tplEnv());
write(path.join(src, 'app.ts'),                                    tplApp());
write(path.join(src, 'server.ts'),                                 tplServer(projectName));

// Empty placeholder dirs (touch a .gitkeep so git tracks them)
for (const dir of ['controllers', 'routes', 'services', 'schemas']) {
  const keep = path.join(src, dir, '.gitkeep');
  write(keep, '');
}

write(path.join(root, 'tsconfig.json'),   tplTsConfig());
write(path.join(root, 'package.json'),    tplPackageJson(projectName));
write(path.join(root, '.env'),            tplEnvFile(projectName));
write(path.join(root, '.env.example'),    tplEnvFile(projectName));
write(path.join(root, '.gitignore'),      tplGitignore());
write(path.join(root, 'README.md'),       tplReadme(projectName));
// Docker + Prettier setup (package.json must exist before generatePrettierSetup)
generateDockerSetup(root, projectName);
generatePrettierSetup(root);

//  Install dependencies grom the packegh json i created previsouly

console.log('\n📦 Installing dependencies…\n');
try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
  console.log('\n📋Done!');
  console.log(`\n  cd ${projectName}`);
  console.log('  npm run dev\n');
} catch (err) {
  console.error('\n ✗ npm install failed. Run it manually inside the project folder.');
}
