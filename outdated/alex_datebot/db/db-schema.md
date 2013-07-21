

#### TABLES ####

USER
id (PKEY, var(100))
name
username


BABE
******
id (PKEY, varchar(100))
cupid_id;
age (INT)
location (VARCHAR (50))
url (varchar(100))
pic (varchar(150))



MATCH
******
id (PKEY, int) 
user_id (FKEY)
babe_id (FKEY)
ignored (NOT NULL, bool, DEFAULT false)
messaged (NOT NULL, bool, DEFAULT false)
success (NOT NULL, bool, DEFAULT false)
date_matched (TIMESTAMP)
date_ignored (TIMESTAMP)
date_messaged (TIMESTAMP)



USER_KEYWORDS
*****************
id (PKEY, int)
user_id (FKEY)
name (varchar(50))
priority (int, NOT NULL, AUTO-INCREMENT)
message (varchar(500))


MATCHED_KEYWORDS
*****************
id (PKEY, int)
match_id (FKEY, int)
keyword_id (FKEY, int)
context (varchar(250))

