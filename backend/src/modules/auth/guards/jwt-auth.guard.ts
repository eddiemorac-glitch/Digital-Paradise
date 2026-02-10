import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private optional: boolean;

    constructor(optional = false) {
        super();
        this.optional = optional;
    }

    canActivate(context: ExecutionContext) {
        // In optional mode, always try to authenticate but don't block if it fails
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        // If optional mode and no user (no token or invalid token), just continue without user
        if (this.optional && !user) {
            return null; // req.user will be null, but request proceeds
        }
        // In required mode, throw if no user
        if (err || !user) {
            throw err || new (require('@nestjs/common').UnauthorizedException)();
        }
        return user;
    }
}
