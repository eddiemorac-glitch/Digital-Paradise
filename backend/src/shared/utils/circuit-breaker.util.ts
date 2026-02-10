
import { Logger } from '@nestjs/common';

export enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

interface CircuitBreakerOptions {
    failureThreshold: number; // Intentos fallidos antes de abrir
    recoveryTimeout: number;   // Tiempo (ms) para pasar de OPEN a HALF-OPEN
    requestTimeout?: number;   // Timeout de la petición individual
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly logger: Logger;
    private readonly serviceName: string;

    private static registry: CircuitBreaker[] = [];

    constructor(serviceName: string, private options: CircuitBreakerOptions) {
        this.serviceName = serviceName;
        this.logger = new Logger(`CircuitBreaker:${serviceName}`);
        CircuitBreaker.registry.push(this);
    }

    async execute<T>(action: () => Promise<T>): Promise<T> {
        this.checkState();

        if (this.state === CircuitState.OPEN) {
            this.logger.warn(`Circuit OPEN for ${this.serviceName}. Request blocked.`);
            throw new Error(`Service ${this.serviceName} is unavailable (Circuit Open)`);
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    getSnapshot() {
        return {
            service: this.serviceName,
            state: CircuitState[this.state],
            failures: this.failureCount,
            lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
            threshold: this.options.failureThreshold
        };
    }

    static getSystemStatus() {
        return CircuitBreaker.registry.map(cb => cb.getSnapshot());
    }

    private checkState() {
        if (this.state === CircuitState.OPEN) {
            const now = Date.now();
            if (now - this.lastFailureTime > this.options.recoveryTimeout) {
                this.state = CircuitState.HALF_OPEN;
                this.logger.log(`Circuit HALF-OPEN for ${this.serviceName}. Testing recovery...`);
            }
        }
    }

    private onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
            this.logger.log(`Circuit CLOSED for ${this.serviceName}. Service recovered.`);
        }
        this.failureCount = 0;
    }

    private onFailure(error: any) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.logger.error(`Request failed for ${this.serviceName}. Count: ${this.failureCount}/${this.options.failureThreshold}. Error: ${error.message}`);

        if (this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.logger.error(`Circuit OPENED for ${this.serviceName}. Failure threshold reached.`);
        }
    }
}
