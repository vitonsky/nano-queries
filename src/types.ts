import { PreparedValue } from './core/PreparedValue';
import { Query } from './core/Query';
import { RawSegment } from './core/RawSegment';

export type PrimitiveValue = string | number | null | boolean;

export interface Value<T> {
	getValue: () => T;
}

export type QueryBindings = PrimitiveValue;
export type QuerySegment = RawSegment | PreparedValue | Query;

export type QueryParameter = QuerySegment | QueryBindings;
export type RawQueryParameter = QueryParameter | undefined;

export interface IQuery {
	/**
	 * Returns query segments number
	 */
	size(): number;

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used to compile SQL
	 */
	getSegments(): QuerySegment[];
}
