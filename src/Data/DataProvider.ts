import rawData12 from '@data/data1.2.json';
import rawData10 from '@data/data1.0.json';
import {IJsonSchema} from '@src/Schema/IJsonSchema';
import model from '@src/Data/Model';

export class DataProvider
{

	public static version: string;
	private static data: IJsonSchema;

	public static get(): IJsonSchema
	{
		return DataProvider.data;
	}

	public static change(version: string)
	{
		DataProvider.version = version;
		// The JSON is generated to match IJsonSchema, but TS widens the large literal's
		// discriminated-union fields (e.g. isVariablePower) to their base types, so assert it.
		if (version === '1.0') {
			DataProvider.data = rawData10 as unknown as IJsonSchema;
		} else {
			DataProvider.data = rawData12 as unknown as IJsonSchema;
		}

		model.change(DataProvider.data);
	}

}
