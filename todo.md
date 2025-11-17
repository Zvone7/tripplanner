
-------------------------

-------------------------

-------------------------
frontend: move all date filtering methods utils/formatters and use those implementations all over code

-------------------------
Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

See more info here: https://nextjs.org/docs/messages/react-hydration-error


-data-darkreader-mode="dynamic"
-data-darkreader-scheme="dark"
-data-darkreader-inline-stroke=""
-style={{--darkreader-inline-stroke:"currentColor"}}
-data-darkreader-inline-stroke=""
-style={{--darkreader-inline-stroke:"currentColor"}}

-------------------------

frontend:move all request making methods to utils/apiClient
create apiClient for options, segments, trips, user, geocoding, etc

cleanup if there are models defined in several places, that should be cleaned up (as in, they are duplicated) - define them only in models.ts and import them where needed

--------------

dark mode - css revamp?

-------------
change default currency - make it configurable as timezone - so both backend and frontend updates

--------------

implement mapperly on backend
--------------
implement languageExt on backend so that the results returned from endpoints always have more detailed exception - always display that in console in browser, but keep the notification to users simple



---------- 20x

- Investigate possible booking.com integration/parsing pasting data
- Investigate possible google flights/skyscanner integration

