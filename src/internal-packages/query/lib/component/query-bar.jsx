const React = require('react');
// const EJSON = require('mongodb-extended-json');
const QueryOption = require('./query-option');
const OptionsToggle = require('./options-toggle');

const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:query-bar');

const QUERY_PROPERTIES = require('../store/query-store').QUERY_PROPERTIES;

const OPTION_DEFINITION = {
  filter: {
    type: 'document',
    placeholder: '{ "filter" : "example" }',
    link: 'https://docs.mongodb.com/TBD'
  },
  project: {
    type: 'document',
    placeholder: '{ "project" : 1 }',
    link: 'https://docs.mongodb.com/TBD'
  },
  sort: {
    type: 'document',
    placeholder: '{ "sort" : 1 }',
    link: 'https://docs.mongodb.com/TBD'
  },
  skip: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/TBD'
  },
  limit: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/TBD'
  }
};

class QueryBar extends React.Component {

  onChange(label, evt) {
    this.props.actions.typeQueryString(label, evt.target.value);
  }

  onApplyButtonClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (this.props.valid || this.props.featureFlag) {
      this.props.actions.apply();
    }
  }

  onResetButtonClicked() {
    this.props.actions.reset();
  }

  _showToggle() {
    return this.props.layout.length > 1;
  }

  _queryHasChanges() {
    const query = _.pick(this.props, QUERY_PROPERTIES);
    return !_.isEqual(query, this.props.lastExecutedQuery);
  }

  /**
   * renders the options toggle button in the top right corner, if the layout
   * is multi-line.
   *
   * @returns {Component|null}  the toggle component or null.
   */
  renderToggle() {
    if (this._showToggle()) {
      return <OptionsToggle expanded={this.props.expanded} />;
    }
    return null;
  }

  /**
   * renders a single query option, either as its own row, or as part of a
   * option group.
   *
   * @param {String} option       the option name to render
   * @param {Number} id           the option number
   * @param {Boolean} hasToggle   this option contains the expand toggle
   *
   * @return {Component}          the option component
   */
  renderOption(option, id, hasToggle) {
    return (
      <QueryOption
        label={option}
        hasToggle={hasToggle}
        hasError={!this.props[`${option}Valid`]}
        key={`query-option-${id}`}
        value={this.props[`${option}String`]}
        placeholder={OPTION_DEFINITION[option].placeholder}
        link={OPTION_DEFINITION[option].link}
        inputType={OPTION_DEFINITION[option].type}
        onChange={this.onChange.bind(this, option)}
      />
    );
  }

  /**
   * renders a group of several query options, that are placed horizontally
   * in the same row.
   *
   * @param {Array} group   The group array, e.g. ['sort', 'skip', 'limit']
   * @param {Number} id     The group number
   *
   * @returns {Component}   The group component
   */
  renderOptionGroup(group, id) {
    const options = _.map(group, (option, i) => {
      return this.renderOption(option, i, false);
    });
    return (
      <div className="querybar-option-group" key={`option-group-${id}`}>
        {options}
      </div>
    );
  }

  /**
   * renders the rows of the querybar component
   *
   * @return {Fragment} array of components, one for each row.
   */
  renderOptionRows() {
    // for multi-line layouts, the first option must be stand-alone
    if (this._showToggle() && !_.isString(this.props.layout[0])) {
      throw new Error('First item in multi-line layout must be single option'
        + ', found' + this.props.layout[0]);
    }
    const rows = _.map(this.props.layout, (row, id) => {
      // only the first in multi-line options has the toggle
      const hasToggle = id === 0 && this._showToggle();
      if (_.isString(row)) {
        return this.renderOption(row, id, hasToggle);
      } else if (_.isArray(row)) {
        return this.renderOptionGroup(row, id);
      }
      throw new Error('Layout items must be string or array, found ' + row);
    });
    if (this.props.expanded) {
      return rows;
    }
    return rows.slice(0, 1);
  }

  /**
   * Render Query Bar input form (just the input fields and buttons).
   *
   * @returns {React.Component} The Query Bar view.
   */
  renderForm() {
    let inputGroupClass = this.props.valid ?
      'querybar-input-group input-group' : 'querybar-input-group input-group has-error';
    if (this.props.featureFlag) {
      inputGroupClass = 'querybar-input-group input-group is-feature-flag';
    }
    const resetButtonStyle = {
      display: this.props.queryState === 'apply' ? 'inline-block' : 'none'
    };
    const applyDisabled = !((this.props.valid && this._queryHasChanges()) || this.props.featureFlag);

    return (
      <form onSubmit={this.onApplyButtonClicked.bind(this)}>
        <div className={inputGroupClass}>
          <div className="querybar-option-container">
            {this.renderOptionRows()}
            {this.renderToggle()}
          </div>
          <div className="querybar-button-group">
            <button
              id="apply_button"
              key="apply-button"
              className="btn btn-primary btn-sm querybar-apply-button"
              data-test-id="apply-filter-button"
              type="button"
              onClick={this.onApplyButtonClicked.bind(this)}
              disabled={applyDisabled}>Apply</button>
            <button
              id="reset_button"
              key="reset-button"
              className="btn btn-default btn-sm querybar-reset-button"
              data-test-id="reset-filter-button"
              type="button"
              onClick={this.onResetButtonClicked.bind(this)}
              style={resetButtonStyle}>Reset</button>
          </div>
        </div>
      </form>
    );
  }

  render() {
    return (
      <div className="querybar-container">
        <div className="querybar-input-container">
          <div className="row">
            <div className="col-md-12">
              {this.renderForm()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

QueryBar.propTypes = {
  filter: React.PropTypes.object,
  project: React.PropTypes.object,
  sort: React.PropTypes.object,
  skip: React.PropTypes.number,
  limit: React.PropTypes.number,

  valid: React.PropTypes.bool,
  filterValid: React.PropTypes.bool,
  projectValid: React.PropTypes.bool,
  sortValid: React.PropTypes.bool,
  skipValid: React.PropTypes.bool,
  limitValid: React.PropTypes.bool,

  featureFlag: React.PropTypes.bool,
  filterString: React.PropTypes.string,
  projectString: React.PropTypes.string,
  sortString: React.PropTypes.string,
  skipString: React.PropTypes.string,
  limitString: React.PropTypes.string,

  actions: React.PropTypes.object,
  queryState: React.PropTypes.string,
  layout: React.PropTypes.array,
  expanded: React.PropTypes.bool,
  lastExecutedQuery: React.PropTypes.object
};

QueryBar.defaultProps = {
  expanded: false,
  layout: ['filter', 'project', ['sort', 'skip', 'limit']]
};

QueryBar.displayName = 'QueryBar';

module.exports = QueryBar;
