import { BaseEntity, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class BaseAttributeEntity extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @CreateDateColumn()
    created_at: string

    @UpdateDateColumn()
    updated_at: string

}