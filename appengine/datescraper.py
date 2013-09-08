# -*- coding: utf-8 -*-
#tyvkanqfsdicezww

import sys
sys.path.insert(0, 'libs') #for being able to use third party libraries

import webapp2
from bs4 import BeautifulSoup
import mechanize
import re
import time #for delaying how often a scrape occurs.

from google.appengine.api import users
from google.appengine.ext import ndb

from google.appengine.api import urlfetch
urlfetch.set_default_fetch_deadline(45) #Extends HTTP request timeout to 45 seconds

def user_key(user="Anonymous"):
    """Constructs a Datastore key for a user entity who sent the message."""
    return ndb.Key('User', user)

def processProfile(resp, userMatch, user):
    # Print the site
    content = resp.get_data()

    #Will use this to parse HTML in front end: http://stackoverflow.com/questions/9551230/jquery-selectors-on-a-html-string
    #Create a new message object and assign the values from POST request
    profile = Profile(parent=user_key(user))
    profile.user = user
    profile.profile_name = userMatch #need to parse this from URL
    profile.html = content
    
    #Begin upsert logic
    preexist_query = Profile.query(Profile.profile_name == profile.profile_name, ancestor=user_key(user)).fetch()
    if len(preexist_query) > 0:
        print "You've already scraped this girl's profile, as the user: %s! Not creating a new entry, but will update HTML in case profile changed" % user
        print preexist_query
        for entry in preexist_query:
            entry.html = profile.html
            entry.put()
    else:
        #Save entry
        profile.put()
        print "Profile scraped and saved! Here is what was written:", str(profile)


class Profile(ndb.Model):
    """Models a profile scraped via Mechanize"""

    date = ndb.DateTimeProperty(auto_now_add=True)
    user = ndb.StringProperty()
    profile_name = ndb.StringProperty()
    html = ndb.TextProperty()
    visited_first = ndb.BooleanProperty(default=False) #This will get updated in a different cron process, TBD

class ScrapeOkc(webapp2.RequestHandler):
    def get(self):

        #Get active user
        user = users.get_current_user().nickname()
        
        #Check if user object came back with a match. If so, script continues
        if not user:
            print 'No user! Time to log in'
            self.redirect(users.create_login_url(self.request.uri))

        username = 'kr7l3g3nd'
        password = 'mewtwo'

        self.response.write("Scrape request received!")            

        #Initialize mechanize
        br = mechanize.Browser()

        # Browser options
        br.set_handle_equiv(True) #This handles a particular type of HTTP equiv meta tag
        br.set_handle_gzip(True) #Handles gzip content type if necessary
        br.set_handle_redirect(True) #Handles 30x redirects
        br.set_handle_referer(True) #Handles being referred to another location
        br.set_handle_robots(False)  # Ignore rules set in robots.txt. 
        
        # Follows refresh 0 but not hangs on refresh > 0
        br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

        br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
        br.open('http://www.okcupid.com/')
        br.select_form(name='loginf')
        br['username'] = username
        br['password'] = password
        br.submit()

        assert br.viewing_html() #Check to make sure browser has access to the HTML
        
        #Open the matches page with certain filters already defined
        
        # #This is the REAL filter. Enable when going live.
        # br.open('http://www.okcupid.com/match?filter1=0,34&filter2=2,20,26&filter3=3,10&filter4=5,2678400&filter5=1,1&filter6=35,2&filter7=32,76&filter8=10,0,16002&locid=0&timekey=1&matchOrderBy=SPECIAL_BLEND&custom_search=0&fromWhoOnline=0&mygender=m&update_prefs=1&sort_type=0&sa=1&using_saved_search=')
        
        #This is a testing filter for more matches
        br.open('http://www.okcupid.com/match?filter1=0,34&filter2=2,20,26&filter3=3,10&filter4=5,2678400&filter5=1,1&filter6=35,2&locid=0&timekey=1&matchOrderBy=MATCH&custom_search=0&fromWhoOnline=0&mygender=m&update_prefs=1&sort_type=0&sa=1&using_saved_search=')


        # Initializing patterns and iterator for handling links we're about to scrape
        resp = None
        pattern = re.compile( '/profile/' ) #looks for a link that brings you to a profile page
        ignore_pattern = re.compile('cf=recently_visited') #We don't want to open a profile of someone already visited
        userMatch = "initalizing userMatch" #declared as global variable so that we don't get "Referenced before assignment" error in loop below
        iterator = 1 #will used to only scrape 20 profiles at a time

        for link in br.links():
            print link.url

        for link in br.links():
            if iterator > 20:
                print "Breaking because iterator is greater than 20"
                break

            siteMatch = pattern.search( link.url )
            ignoreMatch = ignore_pattern.search ( link.url )
            
            if siteMatch and not ignoreMatch:

                #We found a potential valid link. Now, need to check if this was JUST scraped, since the same username appears in a link 3 times per entry. Following the same profile link three times is wasteful
                if re.search(userMatch, link.url):
                    print "We just looked at this profile. Moving on to next link..."
                    continue

                #If above test passes, we've not seen this profile is this browsing session. Continue with scraping
                print 'Found a match that wasn\'t someone I already visited! It was %s' % (link.url)
                print "This is match number " + str(iterator)
                
                userPattern = re.search('/profile/(.*)\?', link.url) #Extracts the username from the URL
                if userPattern:
                    global userMatch #This keeps the variable global, so that we don't get a "Referenced before assignment" error when checking to see if we just looked at this profile
                    userMatch = userPattern.group(1)
                    print userMatch
                
                resp = br.follow_link( link )
                processProfile(resp, userMatch, user) #Function to process the response given by okcupid
                print 'Delaying by 10 seconds...'
                time.sleep(10)
                iterator += 1
                br.back()          


app = webapp2.WSGIApplication([
    ('/datescraper', ScrapeOkc)
], debug=True)
