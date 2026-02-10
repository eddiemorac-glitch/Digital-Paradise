# Build Stage
FROM node:22-alpine As build

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies including devDependencies for build
RUN npm ci

COPY . .

# Build the production application
RUN npm run build

# Production Stage
FROM node:22-alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
