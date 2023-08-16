/*
 * Copyright (C) 2023 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NextFunction, Request, Response } from 'express'
import { logger } from './logger'
import createError from 'http-errors'

function getErrorMessage(error: Error) {
	/**
	 * If it exists, prefer the error stack as it usually
	 * contains the most detail about an error:
	 * an error message and a function call stack.
	 */
	if (error.stack) {
		return error.stack
	}

	if (typeof error.toString === "function") {
		return error.toString()
	}

	return ""
}

/**
 * Log an error message to stderr.
 *
 * @see https://nodejs.org/dist/latest-v14.x/docs/api/console.html#console_console_error_data_args
 *
 * @param {string} error
 */
function logErrorMessage(error: string) {
	logger.error(error)
}

/**
 * Determines if an HTTP status code falls in the 4xx or 5xx error ranges.
 *
 * @param {number} statusCode - HTTP status code
 * @return {boolean}
 */
function isErrorStatusCode(statusCode: number) {
	return statusCode >= 400 && statusCode < 600
}

/**
 * Look for an error HTTP status code (in order of preference):
 *
 * - Error object (`status` or `statusCode`)
 * - Express response object (`statusCode`)
 *
 * Falls back to a 500 (Internal Server Error) HTTP status code.
 *
 * @param {Object} options
 * @param {Error} options.error
 * @param {Object} options.response - Express response object
 * @return {number} - HTTP status code
 */
function getHttpStatusCode(error: Error, response: Response) {

  if (! createError.isHttpError(error))
    return 500 // generic unknown error

	/**
	 * Check if the error object specifies an HTTP
	 * status code which we can use.
	 */
	const statusCodeFromError = error.status || error?.statusCode
	if (isErrorStatusCode(statusCodeFromError)) {
		return statusCodeFromError
	}

	/**
	 * The existing response `statusCode`. This is 200 (OK)
	 * by default in Express, but a route handler or
	 * middleware might already have set an error HTTP
	 * status code (4xx or 5xx).
	 */
	const statusCodeFromResponse = response.statusCode
	if (isErrorStatusCode(statusCodeFromResponse)) {
		return statusCodeFromResponse
	}

	/**
	 * Fall back to a generic error HTTP status code.
	 * 500 (Internal Server Error).
	 *
	 * @see https://httpstatuses.com/500
	 */
	return 500
}

/**
 * Error handler middleware.
 *
 * @param {Error} error - An Error object.
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @param {Function} next - Express `next()` function
 */
export function customErrorHandler(error: Error, request: Request, response: Response, next: NextFunction) {
	const errorMessage = getErrorMessage(error)

	logErrorMessage(errorMessage)

	/**
	 * If response headers have already been sent,
	 * delegate to the default Express error handler.
	 */
	if (response.headersSent) {
		return next(error)
	}

	const errorResponse = {
		statusCode: getHttpStatusCode(error, response),
		body: errorMessage
	}

	/**
	 * Set the response status code.
	 */
	response.status(errorResponse.statusCode)

	/**
	 * Send an appropriately formatted response.
	 *
	 * The Express `res.format()` method automatically
	 * sets `Content-Type` and `Vary: Accept` response headers.
	 *
	 * @see https://expressjs.com/en/api.html#res.format
	 *
	 * This method performs content negotation.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
	 */
	response.format({
		//
		// Callback to run when `Accept` header contains either
		// `application/json` or `*/*`, or if it isn't set at all.
		//
		"application/json": () => {
			/**
			 * Set a JSON formatted response body.
			 * Response header: `Content-Type: `application/json`
			 */
			response.json({ error: errorResponse.body })
		},
		/**
		 * Callback to run when none of the others are matched.
		 */
		default: () => {
			/**
			 * Set a plain text response body.
			 * Response header: `Content-Type: text/plain`
			 */
			response.type("text/plain").send(errorResponse.body)
		},
	})

	/**
	 * Ensure any remaining middleware are run.
	 */
	next()
}
