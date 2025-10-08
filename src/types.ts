import { PreparedValue } from './core/PreparedValue';
import { Query } from './core/Query';
import { RawSegment } from './core/RawSegment';

/**
 * Basic values that may be converted to string
 */
export type BaseValues = string | number | null;

/**
 * Box interface
 */
export interface Value<T> {
	getValue: () => T;
}

/**
 * Entity that contains description of query part
 */
export type QuerySegment<T> = RawSegment | PreparedValue<T> | Query<T>;

/**
 * Input for parsing and packing into one of `QuerySegment` entities
 */
export type RawQueryParameter<T> = QuerySegment<T> | BaseValues | undefined;

export interface IQuery<T> {
	/**
	 * Returns query segments number
	 */
	size(): number;

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used to compile SQL
	 */
	getSegments(): QuerySegment<T>[];
}
