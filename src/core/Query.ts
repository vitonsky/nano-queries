import { IQuery, QueryParameter, QuerySegment, RawQueryParameter } from '../types';
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
		this.segments.push(
			...filterOutEmptySegments(segments).map((segment) => {
				switch (typeof segment) {
					case 'string':
					case 'number':
					case 'boolean':
						return new RawSegment(segment);

					default:
						return segment === null ? new RawSegment(null) : segment;
				}
			}),
		);
	}
}
