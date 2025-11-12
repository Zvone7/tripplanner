

move all date filtering methods utils/formatters and use those implementations all over code

move all request making methods to utils/apiClient
create apiClient for options, segments, trips

cleanup if there are models defined in several places, that should be cleaned up (as in, they are duplicated) - define them only in models.ts and import them where needed

--------------


--------------

implement mapperly on backend
--------------
implement languageExt on backend so that the results returned from endpoints always have more detailed exception - always display that in console in browser, but keep the notification to users simple



---------- 20x

- Investigate possible booking.com integration/parsing pasting data
- Investigate possible google flights/skyscanner integration

