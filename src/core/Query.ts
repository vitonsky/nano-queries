import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from '../types';
import { PreparedValue } from './PreparedValue';
import { RawSegment } from './RawSegment';

export const filterOutEmptySegments = <T>(segments: RawQueryParameter<T>[]) =>
	segments.filter((segment) => segment !== undefined) as QuerySegment<T>[];

// TODO: infer type automatically for all items passed to constructor
// Currently class infer only type of first item appears in array

/**
 * Query constructor that contains sequence of raw segments and prepared values,
 * and may convert raw input to a query segments.
 */
export class Query<T = BaseValues> implements IQuery<T> {
	protected readonly segments: QuerySegment<T>[] = [];
	constructor(...segments: RawQueryParameter<T>[]) {
		if (segments) {
			this.addSegment(...segments);
		}
	}

	/**
	 * Returns query segments number
	 */
	public size() {
		return this.getSegments().length;
	}

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used while compile SQL
	 */
	public getSegments() {
		return this.segments;
	}

	protected addSegment(...segments: RawQueryParameter<T>[]) {
		// TODO: add UnknownValue container to handle it on compile time
		// We leave here only valid values
		loop: for (const segment of segments) {
			if (segment === null) {
				this.segments.push(new RawSegment(null));
				continue;
			}

			switch (typeof segment) {
				case 'string':
				case 'number':
					this.segments.push(new RawSegment(segment));
					continue loop;
			}

			if (
				segment instanceof Query ||
				segment instanceof PreparedValue ||
				segment instanceof RawSegment
			) {
				this.segments.push(segment);
				continue;
			}
		}
	}
}
