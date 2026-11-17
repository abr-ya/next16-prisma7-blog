// feature-153: the route title rule, shared by the form and the server.
//
// The database column is unbounded text, so the limit lives in the product.
// The form refuses a long title before the request leaves the browser, and
// the server refuses it again: the client check is a convenience, the server
// check is the rule. One constant, so the two cannot drift apart.

/** The longest route title the owner can store. */
export const ROUTE_TITLE_MAX_LENGTH = 150;

/** The message the form and the server use for a title that is too long. */
export const ROUTE_TITLE_MAX_LENGTH_MESSAGE = `Title must be ${ROUTE_TITLE_MAX_LENGTH} characters or fewer`;

/** The message the server uses for a missing title. */
export const ROUTE_TITLE_REQUIRED_MESSAGE = "Route title is required";

/**
 * Validate a route title on the server. Returns the reason the title is
 * refused, or `null` when the title is acceptable.
 */
export const validateRouteTitle = (title: string | null | undefined): string | null => {
  const trimmed = title?.trim() ?? "";

  if (!trimmed) {
    return ROUTE_TITLE_REQUIRED_MESSAGE;
  }

  if (trimmed.length > ROUTE_TITLE_MAX_LENGTH) {
    return ROUTE_TITLE_MAX_LENGTH_MESSAGE;
  }

  return null;
};
