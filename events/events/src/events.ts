export class Events {
	static CoreEventSubscriptions: any;
	// Subscribes to events
	static subscribe(event: string, context: string, callback: object) {
		try {
			if (
				typeof event !== "string" ||
				typeof context !== "string" ||
				typeof callback !== "function"
			) {
				console.warn(
					"Invalid event, context or callback passed to Events.subscribe."
				);
				return;
			}

			// Check if already subscribed
			let subscriptions =
				Events.CoreEventSubscriptions.get(event) || new Map();
			let subscription = subscriptions.get(context);

			if (subscription) {
				console.warn(
					`Context ${context} already subscribed to event ${event}.`
				);
				return;
			}

			// Add new subscription
			subscriptions.set(context, callback);
			Events.CoreEventSubscriptions.set(event, subscriptions);

			return {
				event: event,
				context: context,
				callback: callback,
				remove: () => Events.remove(event, context),
			};
		} catch (e: unknown) {
			Events.emit("error", {
				error: e,
			});
		}
	}

	// Remove a subscribed event callback
	static remove(event: string, context:string) {
		try {
			if (typeof event !== "string" || typeof context !== "string") {
				console.warn(
					"Invalid event or string passed to Events.remove."
				);
				return;
			}

			let subscriptions = Events.CoreEventSubscriptions.get(event);

			if (!subscriptions) {
				console.warn(
					`Tried to remove context ${context} from event ${event} that does not exist.`
				);
				return;
			}

			if (subscriptions.has(context)) {
				subscriptions.delete(context);
			}

			Events.CoreEventSubscriptions.set(event, subscriptions);
		} catch (e) {
			Events.emit("error", {
				error: e,
			});
		}
	}

	// Invokes all subscribed event callbacks with the specified parameters
	static emit(event: string, params: object, onError?: object|any) {
		try {
			if (typeof event !== "string") {
				console.warn("Invalid event passed to Events.emit.");
				return;
			}

			let subscriptions = Events.CoreEventSubscriptions.get(event);

			if (!subscriptions) {
				console.warn(`No subscriptions for event ${event}`);
				return;
			}

			// Emit event to each subscription, NOTE this is a map, and not an iterable, for won't work here
			for (const [_, callback] of subscriptions) {
				if (!callback) {
					return;
				}

				callback({
					name: event,
					data: params,
				});
			}
		} catch (e) {
			console.error(e);
			typeof onError === "function" && onError(e);
		}
	}
}

Events.CoreEventSubscriptions = new Map();
