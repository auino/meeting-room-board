import React, { Component } from "react";
import moment from "moment";
import welcomeImage from "../images/welcome.svg";
import spinner from "../images/spinner.svg";
import langs from "../langs.js"

var GOOGLE_API_KEY = null;
var CALENDAR_ID = null;
var CALENDAR_ID_NEW_EVENT = null;
var SHOW_NEW_EVENT = false;
var TIME_FORMAT = "dd, Do MMMM, h:mm A, YYYY";

var lang = langs.langs.en;

export default class App extends Component {
  constructor(props) {
    super(props);
    // getting configuration from url: begin
    var url = require('url');
    var url_parts = url.parse(window.location.href, true).query;
    if(url_parts.googleapikey != null) GOOGLE_API_KEY = url_parts.googleapikey;
    if(url_parts.calendarid != null) CALENDAR_ID = url_parts.calendarid;
    if(url_parts.calendaridnewevent != null) CALENDAR_ID_NEW_EVENT = url_parts.calendaridnewevent;
    if(url_parts.shownewevent != null) SHOW_NEW_EVENT = true;
    if(url_parts.timeformat != null) TIME_FORMAT = url_parts.timeformat;
    if(url_parts.lang != null) {
      if(url_parts.lang == 'en') lang = langs.langs.en;
      if(url_parts.lang == 'it') lang = langs.langs.it;
    }
    // getting configuration from url: end
    this.state = {
      time: moment().format(TIME_FORMAT),
      events: [],
      isBusy: false,
      isEmpty: false,
      isLoading: true
    };
  }

  componentDidMount = () => {
    this.getEvents();
    setInterval(() => {
      this.tick();
    }, 1000);
    setInterval(() => {
      this.getEvents();
    }, 60000);
  };

  getEvents() {
    let that = this;
    function start() {
      gapi.client
        .init({
          apiKey: GOOGLE_API_KEY
        })
        .then(function() {
          return gapi.client.request({
            path: `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?maxResults=11&orderBy=updated&timeMin=${moment().toISOString()}&timeMax=${moment()
              .endOf("day")
              .toISOString()}`
          });
        })
        .then(
          response => {
            let events = response.result.items;
            let sortedEvents = events.sort(function(a, b) {
              return (
                moment(b.start.dateTime).format("YYYYMMDD") -
                moment(a.start.dateTime).format("YYYYMMDD")
              );
            });
            if (events.length > 0) {
              that.setState(
                {
                  events: sortedEvents,
                  isLoading: false,
                  isEmpty: false
                },
                () => {
                  that.setStatus();
                }
              );
            } else {
              that.setState({
                isBusy: false,
                isEmpty: true,
                isLoading: false
              });
            }
          },
          function(reason) {
            console.log(reason);
          }
        );
    }
    gapi.load("client", start);
  }

  tick = () => {
    let time = moment().format(TIME_FORMAT);
    this.setState({
      time: time
    });
  };

  setStatus = () => {
    let now = moment();
    let events = this.state.events;
    for (var e = 0; e < events.length; e++) {
      var eventItem = events[e];
      if (
        moment(now).isBetween(
          moment(eventItem.start.dateTime),
          moment(eventItem.end.dateTime)
        )
      ) {
        this.setState({
          isBusy: true
        });
        return false;
      } else {
        this.setState({
          isBusy: false
        });
      }
    }
  };

  render() {
    const { time, events } = this.state;

    let eventsList = events.map(function(event) {
      return (
        <a
          className="list-group-item"
          href={event.htmlLink}
          target="_blank"
          key={event.id}
        >
          {event.summary}{" "}
          <span className="badge">
            {moment(event.start.dateTime).format("h:mm a")},{" "}
            {moment(event.end.dateTime).diff(
              moment(event.start.dateTime),
              "minutes"
            )}{" "}
            minutes, {moment(event.start.dateTime).format("MMMM Do")}{" "}
          </span>
        </a>
      );
    });

    let emptyState = (
      <div className="empty">
        <img src={welcomeImage} alt="Welcome" />
        <h3>
          No meetings are scheduled for the day. Create one by clicking the
          button below.
        </h3>
      </div>
    );

    let loadingState = (
      <div className="loading">
        <img src={spinner} alt="{lang.loading}" />
      </div>
    );

    return (
      <div className="container">
        <div
          className={
            this.state.isBusy ? "current-status busy" : "current-status open"
          }
        >
          <h1>{this.state.isBusy ? lang.busy : lang.free}</h1>
        </div>
        <div className="upcoming-meetings">
          <div className="current-time">{time}</div>
          <h1>{lang.upcomingmeetings}</h1>
          <div className="list-group">
            {this.state.isLoading && loadingState}
            {events.length > 0 && eventsList}
            {this.state.isEmpty && emptyState}
          </div>
          { SHOW_NEW_EVENT ? <a
            className="primary-cta"
            href="https://calendar.google.com/calendar?cid=${CALENDAR_ID_NEW_EVENT}"
            target="_blank"
          >
            +
          </a> : ''}
        </div>
      </div>
    );
  }
}
