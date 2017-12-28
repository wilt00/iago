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
# create table users (id integer primary key, name varchar(32),
# rating int, created datetime, active boolean);
#
# games:
#   id              int pk
#   black_id        int
#   white_id        int
#   result          enum (white, black, draw, incomplete)
#       0 - incomplete
#       1 - black
#       2 - white
#       3 - draw
#   black_score
#   white_score
#   timestamp       datetime
#
# rating_history:
#   id              autonum
#   user_id         int foreign key
#       FOREIGN KEY(user_id) REFERENCES users(id)
#   timestamp       datetime
#       DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime'))
#   rating          int
#
# create table rating_history (
#   timestamp DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now', 'localtime')),
#   user_id int,
#   rating int,
#   FOREIGN KEY(user_id) REFERENCES users(id) );

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
# post=game, whiteid=id, blackid=id, result=white|black|draw, whitescore=#, blackscore=#


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
            cur.execute('SELECT * FROM users')
            return cur.fetchall()

        elif GET['get'] == 'games':
            cur.execute('SELECT * FROM games')
            return cur.fetchall()

        elif GET['get'] == 'history':
            return {'error': 'not yet implemented'}

        return {'error': 'cannot fetch resource type \'{0}\''.format(GET['get'])}

    return {'error': 'no \'get\' key passed in query string'}

def update_rating(conn, cur, userid, rating):
    cur.execute('INSERT INTO rating_history VALUES (?, ?, ?)', (
        datetime.datetime.now(), userid, rating
    ))
    cur.execute('UPDATE users SET rating=? WHERE userid=?', (
        rating, userid
    ))

def add_user(POST):
    if 'name' not in POST:
        return {'error': 'name not specified for new user'}

    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = user_dict
    cur = conn.cursor()

    # Test for duplicate name
    cur.execute('SELECT userid FROM users WHERE username=?', \
            (POST['name'],))
    if cur.fetchone() is not None:
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

    # update_rating(conn, cur, cur.lastrowid, rating)

    conn.commit()

    newuser = cur.execute( \
            'SELECT * FROM users WHERE userid=?', (cur.lastrowid,))
    return {'status': 'success',
            'user': newuser.fetchone()}

def add_game(POST):
    if ('whiteid' not in POST) or \
        ('blackid' not in POST) or \
        ('result' not in POST):
        return {'error': 'incomplete game, unable to save'}

    if POST['whiteid'] == POST['blackid']:
        return {'error': 'players must have different ids'}

    result = 0
    if POST['result'] == 'black':
        result = 1
    elif POST['result'] == 'white':
        result = 2
    elif POST['result'] == 'draw':
        result = 3
    else:
        return {'error': 'invalid result value \'{0}\''.format(POST['result'])}

    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = user_dict
    cur = conn.cursor()

    cur.execute('SELECT * FROM users WHERE userid=?', (POST['blackid'],))
    blackplr = cur.fetchone()
    if blackplr is None:
        return {'error': 'Black player with id \'{0}\' does not exist'.format(POST['blackid'])}

    cur.execute('SELECT * FROM users WHERE userid=?', (POST['whiteid'],))
    whiteplr = cur.fetchone()
    if whiteplr is None:
        return {'error': 'White player with id \'{0}\' does not exist'.format(POST['whiteid'])}

    blackscore = -1
    if 'blackscore' in POST:
        blackscore = int(POST['blackscore'])

    whitescore = -1
    if 'whitescore' in POST:
        whitescore = int(POST['whitescore'])

    cur.execute('INSERT INTO games VALUES (NULL,?,?,?,?,?,?)', (
        POST['blackid'], POST['whiteid'], result,
        blackscore, whitescore, datetime.datetime.now()
    ))

    conn.commit()

    return {}

def do_post(POST):
    """Handle logic for POST request."""
    if 'post' in POST:
        if POST['post'] == 'game':
            return add_game(POST)
        elif POST['post'] == 'user':
            return add_user(POST)

        return {'error': 'cannot post resource type \'{0}\''.format(POST['post'])}

    return {'error': 'no \'post\' key passed in form submission'}

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

    payload = {}

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
