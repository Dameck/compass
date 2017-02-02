const Reflux = require('reflux');
const app = require('ampersand-app');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const Actions = require('../actions');
const ReadPreference = require('mongodb').ReadPreference;
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:crud:load-more-store');

/**
 * The default read preference.
 */
const READ = ReadPreference.PRIMARY_PREFERRED;

const NUM_PAGE_DOCS = 20;
/**
 * The reflux store for loading more documents.
 */
const LoadMoreDocumentsStore = Reflux.createStore({

  /**
   * Initialize the reset document list store.
   */
  init: function() {
    this.filter = {};
    this.sort = [[ '_id', 1 ]];
    this.limit = 0;
    this.skip = 0;
    this.project = null;
    this.counter = 0;

    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
    this.listenTo(Actions.fetchNextDocuments, this.fetchNextDocuments.bind(this));
  },

  /**
   * Fires when the query is changed. Need to copy the latest query details
   * and reset the counter.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged: function(state) {
    this.filter = state.filter || {};
    this.sort = _.pairs(state.sort);
    this.limit = state.limit;
    this.skip = state.skip;
    this.project = state.project;
    this.counter = 0;
  },

  /**
   * Fetch the next page of documents. Increase the counter by the page size
   * (20 documents) until we reach the user-specified limit. Also take into
   * account user-specified skip.
   *
   * @param {Integer} skip - The number of documents to skip.
   */
  fetchNextDocuments: function(skip) {
    this.counter += NUM_PAGE_DOCS;
    let nextPageCount = 20;
    if (this.limit > 0) {
      nextPageCount = Math.min(Math.max(0, this.limit - this.counter), NUM_PAGE_DOCS);
      if (nextPageCount === 0) {
        return;
      }
    }
    const options = {
      skip: skip + this.skip,
      limit: nextPageCount,
      sort: this.sort,
      fields: this.project,
      readPreference: READ,
      promoteValues: false
    };
    app.dataService.find(NamespaceStore.ns, this.filter, options, (error, documents) => {
      this.trigger(error, documents);
    });
  }
});

module.exports = LoadMoreDocumentsStore;
