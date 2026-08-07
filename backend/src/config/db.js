import { supabaseAdmin } from './supabase.js';

// Helper to convert Supabase query to our format
function mapRow(row) {
  if (!row) return row;
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    mapped[camelKey] = value;
  }
  return mapped;
}

// Database wrapper using Supabase client
export const db = {
  // SELECT query
  async select(columns = '*') {
    const query = supabaseAdmin.from(this._table).select(columns);
    this._query = query;
    return this;
  },

  // FROM clause
  from(table) {
    this._table = table;
    this._query = null;
    return this;
  },

  // WHERE clause
  where(column, operator, value) {
    if (this._query) {
      this._query = this._query.filter(column, operator, value);
    }
    return this;
  },

  // ORDER BY
  orderBy(column, direction = 'asc') {
    if (this._query) {
      this._query = this._query.order(column, { ascending: direction === 'asc' });
    }
    return this;
  },

  // LIMIT
  limit(count) {
    if (this._query) {
      this._query = this._query.limit(count);
    }
    return this;
  },

  // JOIN
  join(table, on) {
    // Supabase handles joins differently
    return this;
  },

  // Execute query and return results
  async execute() {
    if (!this._query) {
      throw new Error('No query built');
    }
    const { data, error } = await this._query;
    if (error) throw error;
    return data || [];
  },

  // INSERT
  async insert(table, values) {
    const { data, error } = await supabaseAdmin.from(table).insert(values).select();
    if (error) throw error;
    return data || [];
  },

  // UPDATE
  async update(table, values, where) {
    let query = supabaseAdmin.from(table).update(values);
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query.select();
    if (error) throw error;
    return data || [];
  },

  // DELETE
  async delete(table, where) {
    let query = supabaseAdmin.from(table).delete();
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query.select();
    if (error) throw error;
    return data || [];
  },
};

// Query builder for complex queries
export class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectColumns = '*';
    this.whereConditions = [];
    this.orderByColumns = [];
    this.limitCount = null;
    this.joinTables = [];
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  where(column, operator, value) {
    this.whereConditions.push({ column, operator, value });
    return this;
  }

  orderBy(column, direction = 'asc') {
    this.orderByColumns.push({ column, direction });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async execute() {
    let query = supabaseAdmin.from(this.table).select(this.selectColumns);

    // Apply where conditions
    for (const { column, operator, value } of this.whereConditions) {
      query = query.filter(column, operator, value);
    }

    // Apply order by
    for (const { column, direction } of this.orderByColumns) {
      query = query.order(column, { ascending: direction === 'asc' });
    }

    // Apply limit
    if (this.limitCount) {
      query = query.limit(this.limitCount);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

// Create a query builder for a table
export function createQueryBuilder(table) {
  return new QueryBuilder(table);
}

// Export the db object as default
export default db;
