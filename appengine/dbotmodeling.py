# -*- coding: utf-8 -*-
#tyvkanqfsdicezww

import cgi
import urllib
import json
import ast #for converting strings into dictionaries. Not needed right now, but here just in case
import re  #regular expressions
import logging #for logging stuff to console

from google.appengine.api import users
from google.appengine.ext import ndb

import os
import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'])


class Message(ndb.Model):
    """Models a message sent via DBot"""

    date = ndb.DateTimeProperty(auto_now_add=True)
    user = ndb.StringProperty()
    sent_to = ndb.StringProperty()
    opener = ndb.StringProperty()
    closer = ndb.StringProperty()
    customized = ndb.BooleanProperty()
    keywords = ndb.JsonProperty()
    used_dbot = ndb.BooleanProperty(default=True) #This will be for experiment where I flip a coin and either use or don't use DBot. Defaults to true
    response = ndb.BooleanProperty(default=False) #This gets updated when I scan my inbox


class Keywords(ndb.Model):
    """Stores the JSON file containing all keywords"""
    date = ndb.DateTimeProperty(auto_now_add=True)
    keywords = ndb.JsonProperty()    

def user_key(user="Anonymous"):
    """Constructs a Datastore key for a user entity who sent the message."""
    return ndb.Key('User', user)

def count_responses(messages):
    """Counts the number of messages pulled from the database that received a response."""
    responses = 0
    for message in messages:
        if message.response == True:
            responses += 1
    return responses

class MainPage(webapp2.RequestHandler):

    def get(self):
        if users.get_current_user():
            user_name = users.get_current_user().nickname()
        else: 
        	user_name = "Anonymous"

        message_query = Message.query(
            ancestor=user_key(user_name)).order(-Message.date)
        messages = message_query.fetch(100)

        if users.get_current_user():
            url = users.create_logout_url(self.request.uri)
            url_linktext = 'Logout'
        else:
            url = users.create_login_url(self.request.uri)
            url_linktext = 'Login'

        counter = len(messages)
        responses = count_responses(messages)

        if counter == 0:
            print "Counter was 0!"
            response_rate = 0
        else:
            response_rate = ((responses*100)//counter)
            print "response_rate is", response_rate

        template_values = {
            'messages': messages,
            'url': url,
            'url_linktext': url_linktext,
            'count': counter,
            'responses': responses,
            'response_rate': response_rate
        }

        template = JINJA_ENVIRONMENT.get_template('index.html')
        self.response.write(template.render(template_values))


def process_keywords(request, arguments):
    """ Cycles through all of the arguments, and constructs a dictionary out of the 'keyword' arguments and their respective position """
    final = {}
    p = re.compile('keywords')

    for argument in arguments:
        if p.search(argument):
            substrings = re.findall(r'(\[keywords\])\[(.*)\]', argument)
            keyword = str(substrings[0][1]) #This substring ends up being the name of the keyword based on RegEx
            position = request.get(argument) #This gets the position of the keyword
            final[keyword] = int(position)

    print final
    return final

class SubmitMessage(webapp2.RequestHandler):
    def post(self):

        #Prints some values for testing
        print self.request.get("interaction[customized]", "Couldn't pull the customized parameter")
        print self.request.get("interaction[opener]", "Couldn't pull opener").strip()
        print self.request.get("interaction[username]", "Couldn't pull username")
        print self.request.get("interaction[closer]", "Couldn't pull closer")

        #Get active user
        if self.request.get("username") is not None:
            user = self.request.get("username")
        else: 
        	user = "Anonymous"

        #Create a new message object and assign the values from POST request
        message = Message(parent=user_key(user))

        message.user = user
        message.sent_to = self.request.get('interaction[username]')
        message.opener = self.request.get('interaction[opener]').strip()
        message.closer = self.request.get('interaction[closer]').strip()

        if self.request.get('interaction[customized]') in ('true', 'True', True):
            message.customized = True
            print "Customized? True"
        else:
            print "Customized? False"
            message.customized = False

        message.keywords = process_keywords(self.request, self.request.arguments())
        if self.request.get('used_dbot'):
            message.used_dbot = self.request.get('used_dbot')

        #Begin upsert logic
        preexist_query = Message.query(Message.sent_to == message.sent_to, ancestor=user_key(user)).fetch()
        if len(preexist_query) > 0:
            print "You've already messaged this girl, as the user: %s! Not creating a new entry" % user
            print preexist_query
            #Will eventually update this to update the entry, rather than reject it
            self.response.write('Girl already exists. No new entry created.')
        else:
            message.put()
            print "Success! Here is what was written:", str(message)
            self.response.write('New entry written! Here\'s what was written:' + str(message))

class ReceiveMessages(webapp2.RequestHandler):
    def post(self):

        #Captures all names in an array
        names = self.request.POST.getall('names[]')
        print names

        self.response.write('Got it, thanks!')

        #Get the correct user for querying the database
        if self.request.get("username") is not None:
            user = self.request.get("username")
        else: 
            user = "Anonymous"        


        #Begin upsert logic
        preexist_query = Message.query(Message.response == False, ancestor=user_key(user)).fetch()

        list_of_entities = []
        for entry in preexist_query:
            for name in names:
                if entry.sent_to == name:
                    print "Found a match!"
                    print name
                    entry.response = True
                    list_of_entities.append(entry)
        ndb.put_multi(list_of_entities)

class ReceiveKeywords(webapp2.RequestHandler):
    def post(self):
        self.response.write('Received request for keywords!')

        full_json = json.loads(self.request.body)
        user = full_json['username'] #No support for anonymous here.
        keyword_list = json.dumps(full_json['keywords']) #Converts keywords back into JSON for storage

        keywords = Keywords(parent=user_key(user))
        keywords.keywords = keyword_list
        keywords.put()

    def get(self):
        username = "jrrera" #Will be updated upon having additional users
        query = Keywords.query(ancestor=user_key(username)).order(-Message.date).get()
        
        keyword_json = query.keywords
        self.response.write(keyword_json)

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/int', SubmitMessage),
    ('/messages', ReceiveMessages),
    ('/keywords', ReceiveKeywords)
], debug=True)

