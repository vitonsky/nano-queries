import { IQuery, QueryParameter, QuerySegment, RawQueryParameter } from '../types';
import { PreparedValue } from './PreparedValue';
import { RawSegment } from './RawSegment';

export const filterOutEmptySegments = (segments: RawQueryParameter[]) =>
	segments.filter((segment) => segment !== undefined) as QueryParameter[];

export class Query implements IQuery {
	protected readonly segments: QuerySegment[] = [];
	constructor(...segments: RawQueryParameter[]) {
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

	protected addSegment(...segments: RawQueryParameter[]) {
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
