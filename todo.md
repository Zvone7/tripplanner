when x-ing out of modal. dont refresh lists

-------------------------

if no changes were made, dont allow clicking save changes


-------------------------
add a title to segment and option models - desribing the option briefly based on values


move all date filtering methods utils/formatters and use those implementations all over code

move all request making methods to utils/apiClient
create apiClient for options, segments, trips

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

