// import {
//     DeepPartial, DeleteResult, FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectId, QueryRunner, Repository, SaveOptions, SelectQueryBuilder, UpdateResult,
// } from 'typeorm';
// import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
// import { LoggerService } from '../logger/logger.service';

// export abstract class BaseService<E> {
//     protected readonly logger: LoggerService;
//     constructor(
//         private readonly repository: Repository<E>,
//         logger: LoggerService,
//     ) {
//         this.logger = logger;
//     }

//     /**
//      * Check if any entities exist that match the given options.
//      *
//      * This method queries the repository to determine if there are any
//      * entities that match the specified criteria.
//      *
//      * @param options Optional. The options to filter the entities. Example:
//      * {
//      *   where: {
//      *     status: 'active'
//      *   }
//      * }
//      * @returns A promise that resolves to `true` if at least one entity
//      * exists that matches the options, otherwise `false`. Example:
//      * true
//      */
//     exists(options?: FindManyOptions<E>): Promise<boolean> {
//         this.logger.log('BaseService - exists - check if entity exists');
//         return this.repository.exists(options);
//     }

//     /**
//      * Create a new entity record in the database.
//      *
//      * @param payload - The data to be saved in the database.
//      * @returns A Promise that resolves to the created entity.
//      *
//      * @example
//      * const newEntity = await this.create({ name: 'New Entity' });
//      */
//     create(payload: DeepPartial<E>): Promise<E> {
//         this.logger.log('BaseService - create - create new entity');
//         const newRecord = this.repository.create(payload);
//         return this.repository.save(newRecord);
//     }

//     /**
//      * Finds entities based on the provided options.
//      *
//      * @param options - The options to apply when querying for entities.
//      * @returns A Promise that resolves to an object containing the found data and the total count.
//      *
//      * @example
//      * const result = await this.find({ where: { active: true } });
//      * console.log(result.data); // Array of entities
//      * console.log(result.count); // Total count of entities
//      */
//     async find(
//         options: FindManyOptions<E>,
//     ): Promise<{ data: E[]; count: number }> {
//         this.logger.log('BaseService - find - get all entities');
//         const [data, dataCount] = await this.repository.findAndCount(options);
//         return {
//             data,
//             count: dataCount,
//         };
//     }

//     /**
//      * Retrieves all entities from the repository based on the provided options.
//      *
//      * @param {FindManyOptions<E>} options - Options to filter, order, and limit the results.
//      * @returns {Promise<E[]>} A promise that resolves to an array of entities.
//      *
//      * @example
//      * const options = { where: { isActive: true }, order: { createdAt: 'DESC' } };
//      * const entities = await this.find(options);
//      * console.log(entities);
//      */
//     async findAll(options: FindManyOptions<E>): Promise<E[]> {
//         this.logger.log('BaseService - find - get all entities');
//         return this.repository.find(options);
//     }

//     /**
//      * Find a single entity based on the provided options.
//      *
//      * @param options - The options to apply when querying for the entity.
//      * @returns A Promise that resolves to the found entity, if any.
//      *
//      * @example
//      * const entity = await this.findOne({ where: { id: 1 } });
//      * console.log(entity); // Found entity
//      */
//     findOne(options?: FindOneOptions<E>): Promise<E> {
//         this.logger.log('BaseService - findOne - get single entity');
//         return this.repository.findOne(options);
//     }

//     /**
//      * Updates entities in the repository based on the given criteria with partial data.
//      *
//      * @param criteria - Criteria to find entities to update. Typically the primary key or a unique identifier of the entity.
//      * @param partialEntity - Partial data of the entity to update. Should be of type QueryDeepPartialEntity<E>, allowing partial updates using query builder syntax.
//      * @returns A promise resolving to an UpdateResult, which contains information about the update operation, such as affected rows.
//      *
//      * @example
//      * ? Example usage:
//      * const criteria = 1; // Example criteria (entity id)
//      * const partialUpdate = { name: 'Updated Name' }; // Example partial data to update
//      * try {
//      *   const updateResult = await updateById(criteria, partialUpdate);
//      *   console.log(`Updated ${updateResult.affected} entities.`);
//      * } catch (error) {
//      *   console.error('Error updating entities:', error.message);
//      * }
//      */
//     update(
//         criteria:
//             | string
//             | number
//             | Date
//             | ObjectId
//             | FindOptionsWhere<E>
//             | string[]
//             | number[]
//             | Date[]
//             | ObjectId[],
//         partialEntity: QueryDeepPartialEntity<E>,
//     ): Promise<UpdateResult> {
//         this.logger.log('BaseService - update - update entities');
//         return this.repository.update(criteria, partialEntity);
//     }

//     /**
//      * Insert or update a batch of entities.
//      *
//      * This method performs a bulk insert or update operation on the provided batch of entities.
//      * The operation is done in chunks of size 5 to manage large datasets efficiently.
//      *
//      * @param batch - An array of partial entities to be inserted or updated.
//      * @returns A Promise that resolves to the saved entities.
//      *
//      * @example
//      * * Assuming you have an array of partial user entities
//      * const users = [
//      *   { id: 1, name: 'John Doe', email: 'john@example.com' },
//      *   { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
//      *   { id: 3, name: 'Jim Doe', email: 'jim@example.com' },
//      *   { id: 4, name: 'Jack Doe', email: 'jack@example.com' },
//      *   { id: 5, name: 'Jill Doe', email: 'jill@example.com' },
//      *   { id: 6, name: 'Joe Doe', email: 'joe@example.com' }
//      * ];
//      *
//      * await myService.batchInsertOrUpdate(users);
//      * * This will insert or update the users in chunks of size 5
//      */
//     batchInsertOrUpdate(batch: DeepPartial<E[]>): Promise<E[]> {
//         /** Chunk option will update the bulk query in chunks of size 5 */
//         this.logger.log(
//             'BaseService - batchInsertOrUpdate - insert or update entities',
//         );
//         return this.repository.save(batch, {
//             chunk: 50,
//         });
//     }

//     /**
//      * Soft delete entities based on the provided criteria.
//      *
//      * @param criteria - The criteria to apply when soft deleting entities.
//      * @returns A Promise that resolves to an object containing the result of the soft delete operation.
//      *
//      * @example
//      * const result = await this.softDelete({ id: 1 });
//      * console.log(result); // Result of the soft delete operation
//      */
//     softDelete(criteria: FindOptionsWhere<E>): Promise<UpdateResult> {
//         this.logger.log('BaseService - softDelete - soft delete entities');
//         return this.repository.softDelete(criteria);
//     }

//     /**
//      * Softly removes an entity or entities by setting the deletion date
//      * without actually deleting the records from the database.
//      *
//      * This method does not permanently remove the records from the database,
//      * instead it sets a special column (e.g., `deletedAt`) to mark them as deleted.
//      *
//      * @param criteria - The entity or entities to be softly removed.
//      *                   This can be a single entity or an array of entities.
//      *                   It should match the shape of the entity to be removed.
//      * @param options - Optional save options for the removal operation.
//      *                  This can include various options such as transaction
//      *                  settings or listeners.
//      * @returns A promise that resolves to the softly removed entity or entities.
//      *          The returned value includes both the partial entity (as specified
//      *          by the criteria) and the complete entity as stored in the database.
//      *
//      * @example
//      * * Soft remove a single entity
//      * const entity = await this.softRemove({ id: 1 });
//      *
//      * @example
//      * * Soft remove multiple entities
//      * const entities = await this.softRemove([{ id: 1 }, { id: 2 }]);
//      */
//     softRemove(
//         criteria: DeepPartial<E>,
//         options?: SaveOptions,
//     ): Promise<DeepPartial<E> & E> {
//         this.logger.log('BaseService - softRemove - soft remove entities');
//         return this.repository.softRemove(criteria, options);
//     }

//     /**
//      * Deletes entity or entities from the database based on the provided criteria.
//      *
//      * @param criteria - The criteria for selecting entities to delete.
//      *                   This can be a single entity ID, a where condition object,
//      *                   or an array of such conditions.
//      * @returns A promise that resolves to a `DeleteResult` object indicating the number
//      *          of affected rows/columns.
//      *
//      * @example
//      * * Delete a single entity by ID
//      * const result = await this.delete({ id: 1 });
//      *
//      * @example
//      * * Delete multiple entities using where conditions
//      * const result = await this.delete({ status: 'archived' });
//      *
//      * @example
//      * * Delete multiple entities by passing an array of IDs
//      * const result = await this.delete([{ id: 1 }, { id: 2 }]);
//      */
//     delete(criteria: FindOptionsWhere<E>): Promise<DeleteResult> {
//         this.logger.log('BaseService - delete - delete entities');
//         return this.repository.delete(criteria);
//     }

//     /**
//      * Creates a new query builder for the repository.
//      *
//      * @return {QueryBuilder<Entity>} A new query builder instance.
//      */
//     createQueryBuilder(
//         alias?: string,
//         queryRunner?: QueryRunner,
//     ): SelectQueryBuilder<E> {
//         return this.repository.createQueryBuilder(alias, queryRunner);
//     }
// }
