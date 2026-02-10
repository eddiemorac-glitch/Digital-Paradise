import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PublicJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // In public mode, we never throw an error, even if there's no user.
        // We simply return the user if they were found, otherwise null.
        return user || null;
    }
}
