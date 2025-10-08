import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { BaseValues } from '../types';

export interface CommandWithBindings<T> {
	command: string;
	bindings: T[];
}

export interface Compiler<T> {
	compile: (query: Query<T>) => CommandWithBindings<T>;
}

// TODO: add hook to preprocess values
export type SQLCompilerConfig = {
	getPlaceholder: (valueIndex: number) => string;
	onPostProcess?: (code: string) => string;
};

export class SQLCompiler<B = BaseValues> implements Compiler<B> {
	private readonly config: SQLCompilerConfig;
	constructor(options?: Partial<SQLCompilerConfig>) {
		this.config = {
			...options,
			getPlaceholder: options?.getPlaceholder ?? (() => '?'),
		};
	}
	/**
	 * Compile query to SQL string and bindings
	 */
	public compile(query: Query<B>): CommandWithBindings<B> {
		const sharedState = {
			valueIndex: 0,
		};

		const processQuery = (query: Query<B>): CommandWithBindings<B> => {
			let command = '';
			const bindings: Array<B> = [];
			for (const segment of query.getSegments()) {
				if (segment instanceof Query) {
					const data = processQuery(segment);
					command += data.command;
					bindings.push(...data.bindings);
					continue;
				}

				if (segment instanceof PreparedValue) {
					const placeholder = this.config.getPlaceholder(
						sharedState.valueIndex,
					);
					sharedState.valueIndex++;

					command += placeholder;
					bindings.push(segment.getValue());
					continue;
				}

				command += segment.getValue();
			}

			return { command, bindings };
		};

		const { command, bindings } = processQuery(query);
		return {
			command: this.config.onPostProcess
				? this.config.onPostProcess(command)
				: command,
			bindings,
		};
	}

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL = (query: Query<B>): { sql: string; bindings: B[] } => {
		const { command: sql, bindings } = this.compile(query);
		return { sql, bindings };
	};
}
