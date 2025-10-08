import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { RawSegment } from '../core/RawSegment';
import { QuerySegment } from '../types';

export const isEmptySegment = <T>(segment: QuerySegment<T>): boolean => {
	if (segment instanceof PreparedValue) return false;

	if (segment instanceof RawSegment) {
		const value = segment.getValue();
		return value === '' || value === null;
	}

	if (segment instanceof Query) {
		return segment.size() === 0;
	}

	return false;
};
