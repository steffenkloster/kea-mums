import { useCallback, useEffect, useRef, useState } from "react";

interface ApiOptions<T> {
	url: string;
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	body?: T;
	headers?: Record<string, string>;
	query?: Record<string, string | string[] | number | boolean | undefined>;
	onSuccess?: (data: any) => void;
	onError?: (error: ApiError) => void;
	debounceMs?: number;
	cache?: boolean;
	cacheBuster?: string | number;
}

interface ApiError {
	message: string;
	status?: number;
	details?: Array<{
		path?: string[];
		message: string;
	}>;
}

interface ApiResponse<T> {
	data: T | null;
	error: ApiError | null;
	isLoading: boolean;
	makeRequest: (overrideOptions?: Partial<ApiOptions<T>>) => Promise<void>;
	cancelRequest: () => void;
	clearError: () => void;
	clearData: () => void;
}

// Cache for storing API responses
const apiCache = new Map<string, any>();

export function useApi<T = any, U = any>(
	defaultOptions?: Partial<ApiOptions<U>>,
): ApiResponse<U> {
	const [data, setData] = useState<U | null>(null);
	const [error, setError] = useState<ApiError | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const abortControllerRef = useRef<AbortController | null>(null);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const optionsRef = useRef(defaultOptions);

	useEffect(() => {
		optionsRef.current = defaultOptions;
	}, [defaultOptions]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const clearData = useCallback(() => {
		setData(null);
	}, []);

	const cancelRequest = useCallback(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setIsLoading(false);
		}
	}, []);

	const createCacheKey = useCallback((options: Partial<ApiOptions<U>>) => {
		if (!options.url) return "";
		const buster =
			options.cacheBuster !== undefined ? `_${options.cacheBuster}` : "";
		return `${options.method || "GET"}_${options.url}_${JSON.stringify(options.body || {})}_${JSON.stringify(options.query || {})}${buster}`;
	}, []);

	const buildUrlWithQuery = useCallback(
		(
			url: string,
			query?: Record<string, any>,
			cacheBuster?: string | number,
		): string => {
			const searchParams = new URLSearchParams();

			if (query) {
				for (const [key, value] of Object.entries(query)) {
					if (value === undefined || value === null) continue;
					if (Array.isArray(value)) {
						for (const v of value) {
							searchParams.append(key, String(v));
						}
					} else {
						searchParams.append(key, String(value));
					}
				}
			}

			if (cacheBuster !== undefined) {
				searchParams.append("_cb", String(cacheBuster));
			}

			const queryString = searchParams.toString();
			return queryString ? `${url}?${queryString}` : url;
		},
		[],
	);

	const performFetch = useCallback(
		async (options: Partial<ApiOptions<U>>): Promise<void> => {
			if (!options.url) {
				setError({ message: 'The "url" option is required.' });
				return;
			}

			const urlWithQuery = buildUrlWithQuery(
				options.url,
				options.query,
				options.cacheBuster,
			);

			if (options.cache) {
				const cacheKey = createCacheKey(options);
				const cachedData = apiCache.get(cacheKey);
				if (cachedData) {
					setData(cachedData);
					options.onSuccess?.(cachedData);
					return;
				}
			}

			abortControllerRef.current = new AbortController();
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(urlWithQuery, {
					method: options.method || "GET",
					headers: {
						"Content-Type": "application/json",
						...options.headers,
					},
					body: options.body ? JSON.stringify(options.body) : undefined,
					signal: abortControllerRef.current.signal,
				});

				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				const responseData = await response.json();

				if (!response.ok) {
					const formattedError: ApiError = {
						message: responseData.error || "An unexpected error occurred",
						status: response.status,
						details: responseData.details || [],
					};

					setError(formattedError);
					options.onError?.(formattedError);
					return;
				}

				if (options.cache) {
					const cacheKey = createCacheKey(options);
					apiCache.set(cacheKey, responseData);
				}

				setData(responseData);
				options.onSuccess?.(responseData);
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") {
					return;
				}

				const errorMessage =
					err instanceof Error ? err.message : "An unexpected error occurred";
				const formattedError: ApiError = {
					message: errorMessage,
				};

				setError(formattedError);
				options.onError?.(formattedError);
			} finally {
				if (!abortControllerRef.current?.signal.aborted) {
					setIsLoading(false);
					abortControllerRef.current = null;
				}
			}
		},
		[buildUrlWithQuery, createCacheKey],
	);

	const makeRequest = useCallback(
		async (overrideOptions?: Partial<ApiOptions<U>>): Promise<void> => {
			cancelRequest();

			const mergedOptions = {
				...optionsRef.current,
				...overrideOptions,
			};

			const debounceMs = mergedOptions.debounceMs || 0;
			if (debounceMs > 0) {
				setIsLoading(true);

				return new Promise((resolve) => {
					debounceTimerRef.current = setTimeout(() => {
						performFetch(mergedOptions).then(resolve);
					}, debounceMs);
				});
			}

			return performFetch(mergedOptions);
		},
		[cancelRequest, performFetch],
	);

	useEffect(() => {
		return () => {
			cancelRequest();
		};
	}, [cancelRequest]);

	return {
		data,
		error,
		isLoading,
		makeRequest,
		cancelRequest,
		clearError,
		clearData,
	};
}

export function mapApiErrorsToFormFields(
	error: ApiError | null,
): Record<string, string> {
	if (!error || !error.details || error.details.length === 0) {
		return {};
	}

	const fieldErrors: Record<string, string> = {};

	for (const detail of error.details) {
		if (detail.path && detail.path.length > 0) {
			fieldErrors[detail.path[0]] = detail.message;
		}
	}

	if (Object.keys(fieldErrors).length === 0 && error.message) {
		fieldErrors.form = error.message;
	}

	return fieldErrors;
}
