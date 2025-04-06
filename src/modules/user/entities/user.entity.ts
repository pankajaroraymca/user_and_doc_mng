import { BadRequestException } from "@nestjs/common"
import { BaseAttributeEntity } from "src/common/entities/base.entity"
import { USER_ROLES } from "src/common/enums/database.enum"
import { DocEntity } from "src/modules/doc/entities/doc.entity"
import { BeforeInsert, Column, Entity, OneToMany } from "typeorm"

@Entity('user')
export class User extends BaseAttributeEntity {

    @Column({ type: 'varchar', length: 50, })
    first_name: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    last_name: string

    @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
    username: string

    @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
    email: string

    @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
    mobile_number: string

    @Column({ type: 'varchar', length: 255 })
    password: string

    @Column({ type: 'enum', enum: USER_ROLES, default: USER_ROLES.VIEWER })
    role: USER_ROLES

    @Column({ type: 'boolean', default: true })
    is_active: boolean

    @OneToMany(() => DocEntity, docEntity => docEntity.owner_relation, { onDelete: 'CASCADE' })
    doc_relation: DocEntity[]

    /**
   * Before insert listener to validate that at least one identifier is provided.
   * @throws BadRequestException if no identifier is provided.
   */
    @BeforeInsert()
    validateMandatoryFields() {
        const identifiers = [this.email, this.mobile_number].filter(Boolean);

        if (identifiers.length === 0) {
            throw new BadRequestException(
                'At least one identifier (email, mobile_number) is required',
            );
        }
    }

}
