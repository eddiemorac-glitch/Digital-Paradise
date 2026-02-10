import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent } from 'typeorm';
import { User } from '../entities/user.entity';

@EventSubscriber()
export class UserLocationSubscriber implements EntitySubscriberInterface<User> {
    /**
     * Indicates that this subscriber only listens to User events.
     */
    listenTo() {
        return User;
    }

    /**
     * Called before user insertion.
     */
    beforeInsert(event: InsertEvent<User>) {
        this.updateLocation(event.entity);
    }

    /**
     * Called before user update.
     */
    beforeUpdate(event: UpdateEvent<User>) {
        if (event.entity) {
            this.updateLocation(event.entity);
        }
    }

    private updateLocation(user: any) {
        // Handled in specific services if needed
    }
}
