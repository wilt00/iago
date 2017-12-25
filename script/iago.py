#!/usr/bin/python

# Goes in
# ~/public_html/cgi-bin/iago.py

import sys
import os
import json
import sqlite3
import cgi
import cgitb
import datetime


# Schema:
# 
# users:
#   id              int pk
#   name            varchar(32)
#   rating          int
#   created         datetime
#   active          bool
#
# games:
#   id              int
#   black_id        int
#   white_id        int
#   result          enum (white, black, draw, incomplete)
#   white_score
#   black_score
#   timestamp       datetime
#
# rating_history:
#   id              autonum
#   user_id         int foreign key
#       FOREIGN KEY(user_id) REFERENCES users(id)
#   timestamp       datetime
#       DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
#   rating          int

# API:
#
# Things we need to be able to do:
# GET
# - List table of all users and ratings - Priority 1
# - List historical rating info of one or more users
# - List stats of one or more players: win/loss ratio, w/l as color,
#     average margin of victory/defeat,
# POST
# - Update user rating
#
# GET
# get=users, id=all, select=all, filter=all
# get - type of record to retrieve
# id - int id of record to retrieve
# select - comma separated list of properties of record to return, or 'all'
# filter - TBD
#
# POST
# post=user, name="name"
# [rating active]
#
# post=game, white=id, black=id, result=white|black|draw, score=#


K_VAL = 32
STARTING_RATING = 1000

DB_NAME = "iago.db"

def parse_args(argdict, input_string):
    """Convert url-encoded string to a dictionary."""
    if input_string == "":
        return
    args = input_string.split('&')
    for _, arg in enumerate(args):
        if arg.split('='):
            key, val = arg.split('=')
            argdict[key] = val

def user_dict(cursor, row):
    """Parse sqlite results as dictionary."""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def do_get(GET):
    if 'get' in GET:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = user_dict
        cur = conn.cursor()

        if GET['get'] == 'users':
            # TODO: implement 'select' and 'filter'
            # select = tuple('*')
            # if ('select' in GET) and (GET['select'] != 'all'):
            #     select = tuple(GET['select'].split(','))

            cur.execute('SELECT * FROM users')
            return cur.fetchall()
        # TODO: implement games and rating history
        else:
            return {'error': 'cannot fetch resource type \'{0}\''.format(GET['get'])}
    else:
        return {'error': 'no \'get\' key passed in query string'}

def add_user(POST):
    if 'name' not in POST:
        return {'error': 'name not specified for new user'}

    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = user_dict
    cur = conn.cursor()

    # Test for duplicate name
    cur.execute('SELECT id FROM users WHERE name=?', \
            (POST['name'],))
    if cur.fetchone() != None:
        return {'error': \
                'user with name {0} already exists in database' \
                    .format(POST['name'])}

    # Form encoding mangles spaces
    name = POST['name'].replace('+', ' ')

    if 'rating' in POST:
        rating = POST['rating']
    else:
        rating = STARTING_RATING

    cur.execute( \
            'insert into users values(NULL, ?, ?, ?, 1)', \
            (name, rating, datetime.datetime.now()))
    conn.commit()

    newuser = cur.execute( \
            'SELECT * FROM users WHERE id=?', (cur.lastrowid,))
    return {'status': 'success',
            'user': newuser.fetchone()}

def do_post(POST):
    if 'post' in POST:
        if POST['post'] == 'game':
            if ('white' not in POST) or \
                    ('black' not in POST) or \
                    ('result' not in POST):
                return {'error': 'incomplete game; unable to save'}

        elif POST['post'] == 'user':
            return add_user(POST)

# https://stackoverflow.com/questions/464040/how-are-post-and-get-variables-handled-in-python#464977 

def main():
    cgitb.enable(display=1, logdir='~/html_logs')

    GET = {}
    POST = {}

    getargs = os.getenv("QUERY_STRING")
    parse_args(GET, getargs)

    postargs = sys.stdin.read()
    parse_args(POST, postargs)

    # Json processing seems broken; stick with urlencoding for now
    # POST = json.load(sys.stdin)
    # try:
    #     if os.environ['CONTENT_LENGTH']:
    #         POST = json.load(sys.stdin)

    # except Exception as e:
    #     print("Status: 400 Bad Request\n")
    #     print(str(e))
    #     print(traceback.print_exc())
    #     return

    payload = None

    if GET != {}:
        payload = do_get(GET)

    elif POST != {}:
        payload = do_post(POST)

    body = json.dumps({ \
        'payload': payload, \
        'debug': { \
            'helloworld': 'Hello, World!', \
            'getargs': getargs, \
            'get': GET, \
            # 'postargs': postargs,
            'post': POST, \
        }})

    if 'error' in payload:
        print("Status: 400 Bad Request\n")
        print(body)

    else:
        print("Status: 200 OK")
        print("Content-type: application/json\n")
        print(body)

main()
