import {IRecipeSchema} from '@src/Schema/IRecipeSchema';
import {IBuildingSchema, IManufacturerSchema} from '@src/Schema/IBuildingSchema';
import {IMinerSchema} from '@src/Schema/IMinerSchema';
import {Constants, RESOURCE_PURITY} from '@src/Constants';
import {IGeneratorSchema} from '@src/Schema/IGeneratorSchema';
import {IItemSchema} from '@src/Schema/IItemSchema';

export class Formula
{

	private static defaultClock = 100;
	private static defaultPowerProductionExponent = 1.6;

	public static calculateBuildingRecipeProductionTime(recipe: IRecipeSchema, building: IBuildingSchema, overclock: number): number
	{
		return (Formula.defaultClock / overclock) * recipe.time * (1 / (building.metadata.manufacturingSpeed || 1));
	}

	public static calculateBuildingPowerConsumption(building: IBuildingSchema, overclock: number)
	{
		return Math.pow(overclock / 100, building.metadata.powerConsumptionExponent || Formula.defaultPowerProductionExponent) * (building.metadata.powerConsumption || 0);
	}

	public static calculateExtractorExtractionValue(building: IBuildingSchema, extractor: IMinerSchema, purity: RESOURCE_PURITY): number
	{
		const extractorMultiplier = Constants.WATER_EXTRACTOR_CLASSNAME === building.className ? 0 : 1;
		const extractedValue = (60 / extractor.extractCycleTime) * (extractor.itemsPerCycle / (extractor.allowLiquids ? 1000 : 1));
		switch (purity) {
			case 'impure':
				return extractedValue * Constants.RESOURCE_MULTIPLIER_IMPURE * extractorMultiplier;
			case 'normal':
				return extractedValue * Constants.RESOURCE_MULTIPLIER_NORMAL;
			case 'pure':
				return extractedValue * Constants.RESOURCE_MULTIPLIER_PURE * extractorMultiplier;
		}
	}

	public static calculateFuelConsumption(generator: IGeneratorSchema, fuel: IItemSchema, overclock: number)
	{
		return ((generator.powerProduction / fuel.energyValue) * 60) * overclock / 100;
	}

	public static calculateProductAmountsPerMinute(building: IManufacturerSchema, recipe: IRecipeSchema, recipeProductAmount: number, overclock: number): number
	{
		const recipeTime = Formula.calculateBuildingRecipeProductionTime(recipe, building, overclock);
		return (60 / (recipe.time * (recipeTime / recipe.time))) * recipeProductAmount;
	}

	public static calculateGeneratorWaterConsumption(building: IGeneratorSchema, overclock: number): number
	{
		return (60 * (Formula.calculatePowerGeneratorPowerCapacity(building, overclock) * building.waterToPowerRatio)) / 1000;
	}

	public static calculatePowerGeneratorPowerCapacity(generator: IGeneratorSchema, overclock: number)
	{
		return (generator.powerProduction * Math.pow(overclock / 100, 1 / generator.powerProductionExponent));
	}

}
