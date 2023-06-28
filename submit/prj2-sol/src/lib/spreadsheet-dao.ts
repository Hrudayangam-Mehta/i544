import { Result, okResult, errResult } from 'cs544-js-utils';
import * as mongo from 'mongodb';

/** All that this DAO should do is maintain a persistent map from
 *  [spreadsheetName, cellId] to an expression string.
 *
 *  Most routines return an errResult with code set to 'DB' if
 *  a database error occurs.
 */

/** return a DAO for spreadsheet ssName at URL mongodbUrl */
export async function makeSpreadsheetDao(mongodbUrl: string, ssName: string): Promise<Result<SpreadsheetDao>> {
  try {
    const daoResult = await SpreadsheetDao.make(mongodbUrl, ssName);
    return daoResult;
  } catch (error) {
    return errResult('DB',  'DB');
  }
}

export class SpreadsheetDao {
  private spreadsheetName: string;
  private collection: mongo.Collection<any>;
  private client: mongo.MongoClient;

  // Factory method
  static async make(dbUrl: string, ssName: string): Promise<Result<SpreadsheetDao>> {
    try {
      const client = await mongo.MongoClient.connect(dbUrl);
      const db = client.db();
      const collection = db.collection(ssName);
      const dao = new SpreadsheetDao(ssName, collection, client);
      return okResult(dao);
    } catch (error) {
      return errResult('DB', 'DB');
    }
  }


  private constructor(spreadsheetName: string, collection: mongo.Collection<any>, client: mongo.MongoClient) {
    this.spreadsheetName = spreadsheetName;
    this.collection = collection;
    this.client = client;
  }

  /** Release all resources held by persistent spreadsheet.
   *  Specifically, close any database connections.
   */
  async close(): Promise<Result<undefined>> {
    try {
      await this.client.close();
      return okResult(undefined);
    } catch (error) {
      return errResult('DB', error);
    }
  }

  /** return name of this spreadsheet */
  getSpreadsheetName(): string {
    return this.spreadsheetName;
  }

  /** Set cell with id cellId to string expr. */
  async setCellExpr(cellId: string, expr: string): Promise<Result<undefined>> {
    try {
      await this.collection.updateOne(
        { _id: cellId },
        { $set: { expression: expr } },
        { upsert: true }
      );
      return okResult(undefined);
    } catch (error) {
      return errResult('DB', error);
    }
  }

  /** Return expr for cell cellId; return '' for an empty/unknown cell. */
  async query(cellId: string): Promise<Result<string>> {
    try {
      const cell: any = await this.collection.findOne({ _id: cellId });
      const expr = cell ? cell.expression : '';
      return okResult(expr);
    } catch (error) {
      return errResult('DB', error);
    }
  }

  /** Clear contents of this spreadsheet */
  async clear(): Promise<Result<undefined>> {
    try {
      await this.collection.deleteMany({});
      return okResult(undefined);
    } catch (error) {
      return errResult('DB', error);
    }
  }

  /** Remove all info for cellId from this spreadsheet. */
  async remove(cellId: string): Promise<Result<undefined>> {
    try {
      await this.collection.deleteOne({ _id: cellId });
      return okResult(undefined);
    } catch (error) {
      return errResult('DB', error);
    }
  }

  /** Return array of [ cellId, expr ] pairs for all cells in this
   *  spreadsheet
   */
  async getData(): Promise<Result<[string, string][]>> {
    try {
      const cells: any[] = await this.collection.find({}).toArray();
      const data: [string, string][] = cells.map((cell) => [cell._id, cell.expression]);
      return okResult(data);
    } catch (error) {
      return errResult('DB', error);
    }
  }
}
