type KeyOfType<T, V> = keyof {
	[P in keyof T as T[P] extends V ? P : never]: unknown
}

export function calls<This>(name: KeyOfType<This, () => void>) {
	return function calls<TVal>(
		target: ClassAccessorDecoratorTarget<This, TVal>,
		_context: ClassAccessorDecoratorContext<This, TVal>
	): ClassAccessorDecoratorResult<This, TVal> {
		function setter(this: This, value: TVal): void {
			const currVal = target.get.call(this);
			target.set.call(this, value);
			if (currVal !== value) {
				(this[name] as () => void).call(this);
			}
		}
		return { set: setter };
	};
}
