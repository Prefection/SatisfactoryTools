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

	public static async change(version: string): Promise<void>
	{
		// Load the version's data lazily so only the active version's ~1.5MB JSON ships in the
		// initial download; the other version is fetched as its own chunk only when selected.
		const mod = version === '1.0'
			? await import('@data/data1.0.json')
			: await import('@data/data1.2.json');
		DataProvider.version = version;
		DataProvider.data = mod.default as unknown as IJsonSchema;
		model.change(DataProvider.data);
	}

}
