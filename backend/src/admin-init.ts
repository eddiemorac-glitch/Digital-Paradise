import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/typeorm';

console.log('[DEBUG] AdminJS: Registering TypeORM adapter (v4 Explicit)...');
AdminJS.registerAdapter({ Database, Resource });
console.log('[DEBUG] AdminJS: TypeORM adapter registered successfully.');
