// Utilities
import get from '../../utils/get'
import looseEqual from '../../utils/loose-equal'
import stableSort from '../../utils/stable-sort'
import KeyCodes from '../../utils/key-codes'
import warn from '../../utils/warn'
import toString from '../../utils/to-string'
import { arrayIncludes, isArray } from '../../utils/array'

// Table helper functions
import normalizeFields from './helpers/normalize-fields'
import sanitizeRow from './helpers/sanitize-row'
import stringifyRecordValues from './helpers/stringify-record-values'
import defaultSortCompare from './helpers/default-sort-compare'
import filterEvent from './helpers/filter-event'
import textSelectionActive from './helpers/text-selection-active'

// Mixins
import idMixin from '../../mixins/id'
import listenOnRootMixin from '../../mixins/listen-on-root'
import normalizeSlotMixin from '../../mixins/normalize-slot'

// Table helper mixins
import captionMixin from './helpers/mixin-caption'
import colgroupMixin from './helpers/mixin-colgroup'
import theadMixin from './helpers/mixin-thead'
import tfootMixin from './helpers/mixin-tfoot'
import busyMixin from './helpers/mixin-busy'
import emptyMixin from './helpers/mixin-empty'
import topRowMixin from './helpers/mixin-top-row'
import bottomRowMixin from './helpers/mixin-bottom-row'

// b-table component definition
// @vue/component
export default {
  name: 'BTable',
  mixins: [
    idMixin,
    listenOnRootMixin,
    normalizeSlotMixin,
    theadMixin,
    tfootMixin,
    busyMixin,
    captionMixin,
    colgroupMixin,
    emptyMixin,
    topRowMixin,
    bottomRowMixin
  ],
  // Don't place ATTRS on root element automatically, as table could be wrapped in responsive div
  inheritAttrs: false,
  props: {
    items: {
      type: [Array, Function],
      default() /* istanbul ignore next */ {
        return []
      }
    },
    fields: {
      type: [Object, Array],
      default: null
    },
    primaryKey: {
      // Primary key for record.
      // If provided the value in each row must be unique!!!
      type: String,
      default: null
    },
    striped: {
      type: Boolean,
      default: false
    },
    bordered: {
      type: Boolean,
      default: false
    },
    borderless: {
      type: Boolean,
      default: false
    },
    outlined: {
      type: Boolean,
      default: false
    },
    dark: {
      type: Boolean,
      default() {
        /* istanbul ignore if */
        if (this && typeof this.inverse === 'boolean') {
          // Deprecate inverse
          warn("b-table: prop 'inverse' has been deprecated. Use 'dark' instead")
          return this.dark
        }
        return false
      }
    },
    inverse: {
      // Deprecated in v1.0.0 in favor of `dark`
      type: Boolean,
      default: null
    },
    hover: {
      type: Boolean,
      default: false
    },
    small: {
      type: Boolean,
      default: false
    },
    fixed: {
      type: Boolean,
      default: false
    },
    responsive: {
      type: [Boolean, String],
      default: false
    },
    stacked: {
      type: [Boolean, String],
      default: false
    },
    busy: {
      type: Boolean,
      default: false
    },
    sortBy: {
      type: String,
      default: null
    },
    sortDesc: {
      type: Boolean,
      default: false
    },
    sortDirection: {
      type: String,
      default: 'asc',
      validator: direction => arrayIncludes(['asc', 'desc', 'last'], direction)
    },
    sortCompare: {
      type: Function,
      default: null
    },
    noSortReset: {
      type: Boolean,
      default: false
    },
    labelSortAsc: {
      type: String,
      default: 'Click to sort Ascending'
    },
    labelSortDesc: {
      type: String,
      default: 'Click to sort Descending'
    },
    perPage: {
      type: Number,
      default: 0
    },
    currentPage: {
      type: Number,
      default: 1
    },
    filter: {
      type: [String, RegExp, Object, Array, Function],
      default: null
    },
    filterFunction: {
      type: Function,
      default: null
    },
    noLocalSorting: {
      type: Boolean,
      default: false
    },
    noProviderPaging: {
      type: Boolean,
      default: false
    },
    noProviderSorting: {
      type: Boolean,
      default: false
    },
    noProviderFiltering: {
      type: Boolean,
      default: false
    },
    apiUrl: {
      // Passthrough prop. Passed to the context object. Not used by b-table directly
      type: String,
      default: ''
    },
    noFooterSorting: {
      type: Boolean,
      default: false
    },
    value: {
      // v-model for retreiving the current displayed rows
      type: Array,
      default() {
        return []
      }
    },
    selectable: {
      type: Boolean,
      default: false
    },
    selectMode: {
      type: String,
      default: 'multi'
    },
    selectedVariant: {
      type: String,
      default: 'primary'
    },
    tbodyClass: {
      type: [String, Array],
      default: null
    },
    tbodyTrClass: {
      type: [String, Array, Function],
      default: null
    },
    tbodyTransitionProps: {
      type: Object
      // default: undefined
    },
    tbodyTransitionHandlers: {
      type: Object
      // default: undefined
    }
  },
  data() {
    return {
      localSortBy: this.sortBy || '',
      localSortDesc: this.sortDesc || false,
      localBusy: false,
      // Our local copy of the items. Must be an array
      localItems: isArray(this.items) ? this.items.slice() : [],
      // Flag for displaying which empty slot to show, and for some event triggering.
      isFiltered: false,
      selectedRows: [],
      lastRowClicked: -1
    }
  },
  computed: {
    // Layout related computed props
    isStacked() {
      return this.stacked === '' ? true : this.stacked
    },
    isResponsive() {
      const responsive = this.responsive === '' ? true : this.responsive
      return this.isStacked ? false : responsive
    },
    responsiveClass() {
      return this.isResponsive === true
        ? 'table-responsive'
        : this.isResponsive
          ? `table-responsive-${this.responsive}`
          : ''
    },
    tableClasses() {
      return {
        'table-striped': this.striped,
        'table-hover': this.hover,
        'table-dark': this.dark,
        'table-bordered': this.bordered,
        'table-borderless': this.borderless,
        'table-sm': this.small,
        border: this.outlined,
        // The following are b-table custom styles
        'b-table-fixed': this.fixed,
        'b-table-stacked': this.stacked === true || this.stacked === '',
        [`b-table-stacked-${this.stacked}`]: this.stacked !== true && this.stacked,
        'b-table-selectable': this.selectable
      }
    },
    bodyClasses() {
      return [this.tbodyClass]
    },
    // Items related computed props
    hasProvider() {
      return this.items instanceof Function
    },
    localFiltering() {
      return this.hasProvider ? !!this.noProviderFiltering : true
    },
    localSorting() {
      return this.hasProvider ? !!this.noProviderSorting : !this.noLocalSorting
    },
    localPaging() {
      return this.hasProvider ? !!this.noProviderPaging : true
    },
    context() {
      // Current state of sorting, filtering and pagination props/values
      return {
        filter: this.localFilter,
        sortBy: this.localSortBy,
        sortDesc: this.localSortDesc,
        perPage: this.perPage,
        currentPage: this.currentPage,
        apiUrl: this.apiUrl
      }
    },
    providerTriggerContext() {
      // Used to trigger the provider function via a watcher. Only the fields that
      // are needed for triggering a provider update are included. Note that the
      // regular this.context is sent to the provider during fetches though, as they
      // may neeed all the prop info.
      const ctx = {
        apiUrl: this.apiUrl
      }
      if (!this.noProviderFiltering) {
        // Either a string, or could be an object or array.
        ctx.filter = this.localFilter
      }
      if (!this.noProviderSorting) {
        ctx.sortBy = this.localSortBy
        ctx.sortDesc = this.localSortDesc
      }
      if (!this.noProviderPaging) {
        ctx.perPage = this.perPage
        ctx.currentPage = this.currentPage
      }
      return ctx
    },
    computedBusy() {
      return this.busy || this.localBusy
    },
    computedFields() {
      // We normalize fields into an array of objects
      // [ { key:..., label:..., ...}, {...}, ..., {..}]
      return normalizeFields(this.fields, this.localItems)
    },
    filteredCheck() {
      // For watching changes to filteredItems vs localItems
      return {
        filteredItems: this.filteredItems,
        localItems: this.localItems,
        localFilter: this.localFilter
      }
    },
    localFilter() {
      // Returns a sanitized/normalized version of filter prop
      if (typeof this.filter === 'function') {
        // this.localFilterFn will contain the correct function ref.
        // Deprecate setting prop filter to a function
        return ''
      } else if (
        typeof this.filterFunction !== 'function' &&
        !(typeof this.filter === 'string' || this.filter instanceof RegExp)
      ) {
        // Using internal filter function, which only acccepts string or regexp at the moment
        return ''
      } else {
        // Could be astring, object or array, as needed by external filter function
        return this.filter
      }
    },
    localFilterFn() {
      let filter = this.filter
      let filterFn = this.filterFunction
      // Sanitized/normalize filter-function prop
      if (typeof filterFn === 'function') {
        return filterFn
      } else if (typeof filter === 'function') {
        // Deprecate setting prop filter to a function
        /* istanbul ignore next */
        return filter
      } else {
        // no filterFunction, so signal to use internal filter function
        return null
      }
    },
    filteredItems() {
      // Returns the records in localItems that match the filter criteria.
      // Returns the original localItems array if not sorting
      let items = this.localItems || []
      const criteria = this.localFilter
      const filterFn =
        this.filterFnFactory(this.localFilterFn, criteria) || this.defaultFilterFnFactory(criteria)

      // We only do local filtering if requested, and if the are records to filter and
      // if a filter criteria was specified
      if (this.localFiltering && filterFn && items.length > 0) {
        items = items.filter(filterFn)
      }
      return items
    },
    sortedItems() {
      // Sorts the filtered items and returns a new array of the sorted items
      // or the original items array if not sorted.
      let items = this.filteredItems || []
      const sortBy = this.localSortBy
      const sortDesc = this.localSortDesc
      const sortCompare = this.sortCompare
      const localSorting = this.localSorting
      if (sortBy && localSorting) {
        // stableSort returns a new arary, and leaves the original array intact
        return stableSort(items, (a, b) => {
          let result = null
          if (typeof sortCompare === 'function') {
            // Call user provided sortCompare routine
            result = sortCompare(a, b, sortBy, sortDesc)
          }
          if (result === null || result === undefined || result === false) {
            // Fallback to built-in defaultSortCompare if sortCompare not defined or returns null/false
            result = defaultSortCompare(a, b, sortBy)
          }
          // Negate result if sorting in descending order
          return (result || 0) * (sortDesc ? -1 : 1)
        })
      }
      return items
    },
    paginatedItems() {
      let items = this.sortedItems || []
      const currentPage = Math.max(parseInt(this.currentPage, 10) || 1, 1)
      const perPage = Math.max(parseInt(this.perPage, 10) || 0, 0)
      // Apply local pagination
      if (this.localPaging && !!perPage) {
        // Grab the current page of data (which may be past filtered items limit)
        items = items.slice((currentPage - 1) * perPage, currentPage * perPage)
      }
      // Return the items to display in the table
      return items
    },
    computedItems() {
      return this.paginatedItems || []
    }
  },
  watch: {
    // Watch props for changes and update local values
    items(newItems) {
      if (this.hasProvider || newItems instanceof Function) {
        this.$nextTick(this._providerUpdate)
      } else if (isArray(newItems)) {
        // Set localItems/filteredItems to a copy of the provided array
        this.localItems = newItems.slice()
      } else {
        this.localItems = []
      }
    },
    sortDesc(newVal, oldVal) {
      if (newVal === this.localSortDesc) {
        /* istanbul ignore next */
        return
      }
      this.localSortDesc = newVal || false
    },
    sortBy(newVal, oldVal) {
      if (newVal === this.localSortBy) {
        return
      }
      this.localSortBy = newVal || null
    },
    selectMode(newVal, oldVal) {
      if (oldVal !== newVal) {
        this.clearSelected()
      }
    },
    // Update .sync props
    localSortDesc(newVal, oldVal) {
      // Emit update to sort-desc.sync
      if (newVal !== oldVal) {
        this.clearSelected()
        this.$emit('update:sortDesc', newVal)
      }
    },
    localSortBy(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.clearSelected()
        this.$emit('update:sortBy', newVal)
      }
    },
    localBusy(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$emit('update:busy', newVal)
      }
    },
    // Watch for changes on computedItems and update the v-model
    computedItems(newVal, oldVal) {
      // Reset for selectable
      this.lastRowClicked = -1
      this.$emit('input', newVal)
      let equal = false
      if (this.selectable && this.selectedRows.length > 0) {
        // Quick check against array length
        equal = isArray(newVal) && isArray(oldVal) && newVal.length === oldVal.length
        for (let i = 0; equal && i < newVal.length; i++) {
          // Look for the first non-loosely equal row, after ignoring reserved fields
          equal = looseEqual(sanitizeRow(newVal[i]), sanitizeRow(oldVal[i]))
        }
      }
      if (!equal) {
        this.clearSelected()
      }
    },
    selectable(newVal, oldVal) {
      // Clear selection if prop selectable changes
      this.clearSelected()
    },
    // Watch for changes to the filter criteria and filtered items vs localItems).
    // And set visual state and emit events as required
    filteredCheck({ filteredItems, localItems, localFilter }) {
      // Determine if the dataset is filtered or not
      let isFiltered
      if (!localFilter) {
        // If filter criteria is falsey
        isFiltered = false
      } else if (looseEqual(localFilter, []) || looseEqual(localFilter, {})) {
        // If filter criteria is an empty array or object
        isFiltered = false
      } else if (localFilter) {
        // if Filter criteria is truthy
        isFiltered = true
      } else {
        isFiltered = false
      }
      if (isFiltered) {
        this.clearSelected()
        this.$emit('filtered', filteredItems, filteredItems.length)
      }
      this.isFiltered = isFiltered
    },
    isFiltered(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.clearSelected()
      }
      if (newVal === false && oldVal === true) {
        // We need to emit a filtered event if isFiltered transitions from true to
        // false so that users can update their pagination controls.
        this.$emit('filtered', this.localItems, this.localItems.length)
      }
    },
    context(newVal, oldVal) {
      // Emit context info for enternal paging/filtering/sorting handling
      if (!looseEqual(newVal, oldVal)) {
        this.$emit('context-changed', newVal)
      }
    },
    // Provider update triggering
    providerTriggerContext(newVal, oldVal) {
      // Trigger the provider to update as the relevant context values have changed.
      if (!looseEqual(newVal, oldVal)) {
        this.$nextTick(this._providerUpdate)
      }
    }
  },
  mounted() {
    // Call the items provider if necessary
    if (this.hasProvider && (!this.localItems || this.localItems.length === 0)) {
      // Fetch on mount if localItems is empty
      this._providerUpdate()
    }

    // Initially update the v-model of displayed items
    this.$emit('input', this.computedItems)

    // Listen for global messages to tell us to force refresh the table
    this.listenOnRoot('bv::refresh::table', id => {
      if (id === this.id || id === this) {
        this.refresh()
      }
    })
  },
  methods: {
    // Methods for computing classes, attributes and styles for table cells
    tdClasses(field, item) {
      let cellVariant = ''
      if (item._cellVariants && item._cellVariants[field.key]) {
        cellVariant = `${this.dark ? 'bg' : 'table'}-${item._cellVariants[field.key]}`
      }
      return [
        field.variant && !cellVariant ? `${this.dark ? 'bg' : 'table'}-${field.variant}` : '',
        cellVariant,
        field.class ? field.class : '',
        this.getTdValues(item, field.key, field.tdClass, '')
      ]
    },
    tdAttrs(field, item, colIndex) {
      let attrs = {}
      attrs['aria-colindex'] = String(colIndex + 1)
      if (field.isRowHeader) {
        attrs['scope'] = 'row'
      }
      if (this.isStacked) {
        // Generate the "header cell" label content in stacked mode
        attrs['data-label'] = field.label
        if (field.isRowHeader) {
          attrs['role'] = 'rowheader'
        } else {
          attrs['role'] = 'cell'
        }
      }
      return { ...attrs, ...this.getTdValues(item, field.key, field.tdAttr, {}) }
    },
    rowClasses(item) {
      return [
        item._rowVariant ? `${this.dark ? 'bg' : 'table'}-${item._rowVariant}` : '',
        typeof this.tbodyTrClass === 'function' ? this.tbodyTrClass(item, 'row') : this.tbodyTrClass
      ]
    },
    getTdValues(item, key, tdValue, defValue) {
      const parent = this.$parent
      if (tdValue) {
        const value = get(item, key, '')
        if (typeof tdValue === 'function') {
          return tdValue(value, key, item)
        } else if (typeof tdValue === 'string' && typeof parent[tdValue] === 'function') {
          return parent[tdValue](value, key, item)
        }
        return tdValue
      }
      return defValue
    },
    // Method to get the value for a field
    getFormattedValue(item, field) {
      const key = field.key
      const formatter = field.formatter
      const parent = this.$parent
      let value = get(item, key, null)
      if (formatter) {
        if (typeof formatter === 'function') {
          value = formatter(value, key, item)
        } else if (typeof formatter === 'string' && typeof parent[formatter] === 'function') {
          value = parent[formatter](value, key, item)
        }
      }
      return value === null || typeof value === 'undefined' ? '' : value
    },
    // Filter Function factories
    filterFnFactory(filterFn, criteria) {
      // Wrapper factory for external filter functions.
      // Wrap the provided filter-function and return a new function.
      // returns null if no filter-function defined or if criteria is falsey.
      // Rather than directly grabbing this.computedLocalFilterFn or this.filterFunction
      // We have it passed, so that the caller computed prop will be reactive to changes
      // in the original filter-function (as this routine is a method)
      if (!filterFn || !criteria || typeof filterFn !== 'function') {
        return null
      }

      // Build the wrapped filter test function, passing the criteria to the provided function
      const fn = item => {
        // Generated function returns true if the crieria matches part of the serialzed data, otherwise false
        return filterFn(item, criteria)
      }

      // return the wrapped function
      return fn
    },
    defaultFilterFnFactory(criteria) {
      // Generates the default filter function, using the given flter criteria
      if (!criteria || !(typeof criteria === 'string' || criteria instanceof RegExp)) {
        // Bult in filter can only support strings or RegExp criteria (at the moment)
        return null
      }

      // Build the regexp needed for filtering
      let regexp = criteria
      if (typeof regexp === 'string') {
        // Escape special RegExp characters in the string and convert contiguous
        // whitespace to \s+ matches
        const pattern = criteria
          .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
          .replace(/[\s\uFEFF\xA0]+/g, '\\s+')
        // Build the RegExp (no need for global flag, as we only need to find the value once in the string)
        regexp = new RegExp(`.*${pattern}.*`, 'i')
      }

      // Generate the wrapped filter test function to use
      const fn = item => {
        // This searches all row values (and sub property values) in the entire (excluding
        // special _ prefixed keys), because we convert the record to a space-separated
        // string containing all the value properties (recursively), even ones that are
        // not visible (not specified in this.fields).
        //
        // TODO: enable searching on formatted fields and scoped slots
        // TODO: should we filter only on visible fields (i.e. ones in this.fields) by default?
        // TODO: allow for searching on specific fields/key, this could be combined with the previous TODO
        // TODO: give stringifyRecordValues extra options for filtering (i.e. passing the fields definition
        //      and a reference to $scopedSlots)
        //
        // Generated function returns true if the crieria matches part of the serialzed data, otherwise false
        // We set lastIndex = 0 on regex in case someone uses the /g global flag
        regexp.lastIndex = 0
        return regexp.test(stringifyRecordValues(item))
      }

      // Return the generated function
      return fn
    },
    clearSelected() {
      let hasSelection = this.selectedRows.reduce((prev, v) => {
        return prev || v
      }, false)
      if (hasSelection) {
        this.lastRowClicked = -1
        this.selectedRows = []
        this.$emit('row-selected', [])
      }
    },
    // Event handlers
    rowClicked(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      } else if (filterEvent(e)) {
        // clicked on a non-disabled control so ignore
        return
      } else if (textSelectionActive()) {
        // User is selecting text, so ignore
        /* istanbul ignore next: JSDOM doesn't support getSelection() */
        return
      }
      if (e.type === 'keydown') {
        // If the click was generated by space or enter, stop page scroll
        e.stopPropagation()
        e.preventDefault()
      }
      if (this.selectable) {
        let selected = !this.selectedRows[index]
        switch (this.selectMode) {
          case 'single':
            this.selectedRows = []
            break
          case 'range':
            if (this.lastRowClicked >= 0 && e.shiftKey) {
              // range
              for (
                let idx = Math.min(this.lastRowClicked, index);
                idx <= Math.max(this.lastRowClicked, index);
                idx++
              ) {
                this.selectedRows[idx] = true
              }
              selected = true
            } else {
              if (!(e.ctrlKey || e.metaKey)) {
                // clear range selection if any
                this.selectedRows = []
                selected = true
              }
              this.lastRowClicked = selected ? index : -1
            }
            break
        }
        this.$set(this.selectedRows, index, selected)
        let items = []
        this.selectedRows.forEach((v, idx) => {
          if (v) {
            items.push(this.computedItems[idx])
          }
        })
        this.$emit('row-selected', items)
      }
      this.$emit('row-clicked', item, index, e)
    },
    middleMouseRowClicked(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      }
      this.$emit('row-middle-clicked', item, index, e)
    },
    rowDblClicked(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      } else if (filterEvent(e)) {
        // clicked on a non-disabled control so ignore
        return
      }
      this.$emit('row-dblclicked', item, index, e)
    },
    rowHovered(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      }
      this.$emit('row-hovered', item, index, e)
    },
    rowUnhovered(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      }
      this.$emit('row-unhovered', item, index, e)
    },
    rowContextmenu(e, item, index) {
      if (this.stopIfBusy(e)) {
        // If table is busy (via provider) then don't propagate
        return
      }
      this.$emit('row-contextmenu', item, index, e)
    },
    stopIfBusy(evt) {
      if (this.computedBusy) {
        // If table is busy (via provider) then don't propagate
        evt.preventDefault()
        evt.stopPropagation()
        return true
      }
      return false
    },
    // Exposed method(s)
    refresh() {
      this.$off('refreshed', this.refresh)
      if (this.computedBusy) {
        // Can't force an update when forced busy by user (busy prop === true)
        if (this.localBusy && this.hasProvider) {
          // But if provider running (localBusy), re-schedule refresh once `refreshed` emitted
          this.$on('refreshed', this.refresh)
        }
      } else {
        this.clearSelected()
        if (this.hasProvider) {
          this.$nextTick(this._providerUpdate)
        } else {
          this.localItems = isArray(this.items) ? this.items.slice() : []
        }
      }
    },
    // Provider related methods
    _providerSetLocal(items) {
      this.localItems = isArray(items) ? items.slice() : []
      this.localBusy = false
      this.$emit('refreshed')
      // New root emit
      if (this.id) {
        this.emitOnRoot('bv::table::refreshed', this.id)
      }
    },
    _providerUpdate() {
      // Refresh the provider function items.
      if (!this.hasProvider) {
        // Do nothing if no provider
        return
      }
      // If table is busy, wait until refereshed before calling again
      if (this.computedBusy) {
        // Schedule a new refresh once `refreshed` is emitted
        this.$nextTick(this.refresh)
        return
      }

      // Set internal busy state
      this.localBusy = true

      // Call provider function with context and optional callback after DOM is fully updated
      this.$nextTick(function() {
        try {
          // Call provider function passing it the context and optional callback
          const data = this.items(this.context, this._providerSetLocal)
          if (data && data.then && typeof data.then === 'function') {
            // Provider returned Promise
            data.then(items => {
              // Provider resolved with items
              this._providerSetLocal(items)
            })
          } else if (isArray(data)) {
            // Provider returned Array data
            this._providerSetLocal(data)
          } else if (this.items.length !== 2) {
            // Check number of arguments provider function requested
            // Provider not using callback (didn't request second argument), so we clear
            // busy state as most likely there was an error in the provider function
            /* istanbul ignore next */
            warn(
              "b-table provider function didn't request calback and did not return a promise or data"
            )
            /* istanbul ignore next */
            this.localBusy = false
          }
        } catch (e) /* istanbul ignore next */ {
          // Provider function borked on us, so we spew out a warning
          // and clear the busy state
          warn(`b-table provider function error [${e.name}] ${e.message}`)
          this.localBusy = false
          this.$off('refreshed', this.refresh)
        }
      })
    }
  },
  render(h) {
    const $scoped = this.$scopedSlots
    const fields = this.computedFields
    const items = this.computedItems
    const tableStriped = this.striped
    const hasRowClickHandler = this.$listeners['row-clicked'] || this.selectable

    // Build the caption (from caption mixin)
    const $caption = this.renderCaption(h)

    // Build the colgroup
    const $colgroup = this.renderColgroup(h)

    // Build the thead
    const $thead = this.renderThead(h)

    // Build the tfoot
    const $tfoot = this.renderTfoot(h)

    // Prepare the tbody rows
    const rows = []

    // Add static Top Row slot (hidden in visibly stacked mode as we can't control the data-label)
    rows.push(this.renderTopRow(h))

    // Add the item data rows or the busy slot
    const $busy = this.renderBusy(h)
    if ($busy) {
      rows.push($busy)
    } else {
      // Show the rows
      items.forEach((item, rowIndex) => {
        const detailsSlot = $scoped['row-details']
        const rowShowDetails = Boolean(item._showDetails && detailsSlot)
        const rowSelected = this.selectedRows[rowIndex]
        // Details ID needed for aria-describedby when details showing
        const detailsId = rowShowDetails ? this.safeId(`_details_${rowIndex}_`) : null
        const toggleDetailsFn = () => {
          if (detailsSlot) {
            this.$set(item, '_showDetails', !item._showDetails)
          }
        }
        // For each item data field in row
        const tds = fields.map((field, colIndex) => {
          const formatted = this.getFormattedValue(item, field)
          const data = {
            // For the Vue key, we concatinate the column index and field key (as field keys can be duplicated)
            key: `row-${rowIndex}-cell-${colIndex}-${field.key}`,
            class: this.tdClasses(field, item),
            attrs: this.tdAttrs(field, item, colIndex),
            domProps: {}
          }
          let childNodes
          if ($scoped[field.key]) {
            childNodes = [
              $scoped[field.key]({
                item: item,
                index: rowIndex,
                field: field,
                unformatted: get(item, field.key, ''),
                value: formatted,
                toggleDetails: toggleDetailsFn,
                detailsShowing: Boolean(item._showDetails),
                rowSelected: Boolean(rowSelected)
              })
            ]
            if (this.isStacked) {
              // We wrap in a DIV to ensure rendered as a single cell when visually stacked!
              childNodes = [h('div', {}, [childNodes])]
            }
          } else {
            if (this.isStacked) {
              // We wrap in a DIV to ensure rendered as a single cell when visually stacked!
              childNodes = [h('div', toString(formatted))]
            } else {
              // Non stacked
              childNodes = toString(formatted)
            }
          }
          // Render either a td or th cell
          return h(field.isRowHeader ? 'th' : 'td', data, childNodes)
        })
        // Calculate the row number in the dataset (indexed from 1)
        let ariaRowIndex = null
        if (this.currentPage && this.perPage && this.perPage > 0) {
          ariaRowIndex = String((this.currentPage - 1) * this.perPage + rowIndex + 1)
        }
        // Create a unique :key to help ensure that sub components are re-rendered rather than
        // re-used, which can cause issues. If a primary key is not provided we use the rendered
        // rows index within the tbody.
        // See: https://github.com/bootstrap-vue/bootstrap-vue/issues/2410
        const primaryKey = this.primaryKey
        const rowKey =
          primaryKey && item[primaryKey] !== undefined && item[primaryKey] !== null
            ? toString(item[primaryKey])
            : String(rowIndex)
        // If primary key is provided, use it to generate a unique ID on each tbody > tr
        // In the format of '{tableId}__row_{primaryKeyValue}'
        const rowId =
          primaryKey && item[primaryKey] !== undefined && item[primaryKey] !== null
            ? this.safeId(`_row_${item[primaryKey]}`)
            : null
        // Assemble and add the row
        rows.push(
          h(
            'tr',
            {
              key: `__b-table-row-${rowKey}__`,
              class: [
                this.rowClasses(item),
                {
                  'b-table-has-details': rowShowDetails,
                  'b-row-selected': rowSelected,
                  [`${this.dark ? 'bg' : 'table'}-${this.selectedVariant}`]:
                    rowSelected && this.selectedVariant
                }
              ],
              attrs: {
                id: rowId,
                tabindex: hasRowClickHandler ? '0' : null,
                'data-pk': rowId ? String(item[primaryKey]) : null,
                'aria-describedby': detailsId,
                'aria-owns': detailsId,
                'aria-rowindex': ariaRowIndex,
                'aria-selected': this.selectable ? (rowSelected ? 'true' : 'false') : null,
                role: this.isStacked ? 'row' : null
              },
              on: {
                // TODO: only instatiate handlers if we have registered listeners
                auxclick: evt => {
                  if (evt.which === 2) {
                    this.middleMouseRowClicked(evt, item, rowIndex)
                  }
                },
                click: evt => {
                  this.rowClicked(evt, item, rowIndex)
                },
                keydown: evt => {
                  const keyCode = evt.keyCode
                  if (keyCode === KeyCodes.ENTER || keyCode === KeyCodes.SPACE) {
                    if (
                      evt.target &&
                      evt.target.tagName === 'TR' &&
                      evt.target === document.activeElement
                    ) {
                      this.rowClicked(evt, item, rowIndex)
                    }
                  }
                },
                contextmenu: evt => {
                  this.rowContextmenu(evt, item, rowIndex)
                },
                // Note: these events are not accessibility friendly
                dblclick: evt => {
                  this.rowDblClicked(evt, item, rowIndex)
                },
                mouseenter: evt => {
                  this.rowHovered(evt, item, rowIndex)
                },
                mouseleave: evt => {
                  this.rowUnhovered(evt, item, rowIndex)
                }
              }
            },
            tds
          )
        )
        // Row Details slot
        if (rowShowDetails) {
          const tdAttrs = { colspan: String(fields.length) }
          const trAttrs = { id: detailsId }
          if (this.isStacked) {
            tdAttrs['role'] = 'cell'
            trAttrs['role'] = 'row'
          }
          const details = h('td', { attrs: tdAttrs }, [
            detailsSlot({
              item: item,
              index: rowIndex,
              fields: fields,
              toggleDetails: toggleDetailsFn
            })
          ])
          if (tableStriped) {
            // Add a hidden row to keep table row striping consistent when details showing
            rows.push(
              h('tr', {
                key: `__b-table-details-${rowIndex}-stripe__`,
                staticClass: 'd-none',
                attrs: { 'aria-hidden': 'true' }
              })
            )
          }
          rows.push(
            h(
              'tr',
              {
                key: `__b-table-details-${rowIndex}__`,
                staticClass: 'b-table-details',
                class: [
                  typeof this.tbodyTrClass === 'function'
                    ? this.tbodyTrClass(item, 'row-details')
                    : this.tbodyTrClass
                ],
                attrs: trAttrs
              },
              [details]
            )
          )
        } else if (detailsSlot) {
          // Only add the placeholder if a the table has a row-details slot defined (but not shown)
          rows.push(h(false))
          if (tableStriped) {
            // add extra placeholder if table is striped
            rows.push(h(false))
          }
        }
      })
    }

    // Empty Items / Empty Filtered Row slot
    rows.push(this.renderEmpty(h))

    // Static bottom row slot (hidden in visibly stacked mode as we can't control the data-label)
    rows.push(this.renderBottomRow(h))

    // Is tbody transition enabled
    const isTransGroup = this.tbodyTransitionProps || this.tbodyTransitionHandlers
    let tbodyProps = {}
    let tbodyOn = {}
    if (isTransGroup) {
      tbodyOn = this.tbodyTransitionHandlers || {}
      tbodyProps = {
        ...(this.tbodyTransitionProps || {}),
        tag: 'tbody'
      }
    }

    // Assemble the rows into the tbody
    const $tbody = h(
      isTransGroup ? 'transition-group' : 'tbody',
      {
        props: tbodyProps,
        on: tbodyOn,
        class: this.bodyClasses,
        attrs: this.isStacked ? { role: 'rowgroup' } : {}
      },
      rows
    )

    // Assemble table
    const $table = h(
      'table',
      {
        key: 'b-table',
        staticClass: 'table b-table',
        class: this.tableClasses,
        attrs: {
          // We set aria-rowcount before merging in $attrs, in case user has supplied their own
          'aria-rowcount':
            this.filteredItems.length > items.length ? String(this.filteredItems.length) : null,
          // Merge in user supplied $attrs if any
          ...this.$attrs,
          // Now we can override any $attrs here
          id: this.safeId(),
          role: this.isStacked ? 'table' : null,
          'aria-multiselectable': this.selectable
            ? this.selectMode === 'single'
              ? 'false'
              : 'true'
            : null,
          'aria-busy': this.computedBusy ? 'true' : 'false',
          'aria-colcount': String(fields.length),
          'aria-describedby':
            [
              // Preserve user supplied aria-describedby, if provided in $attrs
              (this.$attrs || {})['aria-describedby'],
              this.captionId
            ]
              .filter(a => a)
              .join(' ') || null
        }
      },
      [$caption, $colgroup, $thead, $tfoot, $tbody]
    )

    // Add responsive wrapper if needed and return table
    return this.isResponsive
      ? h('div', { key: 'b-table-responsive', class: this.responsiveClass }, [$table])
      : $table
  }
}
