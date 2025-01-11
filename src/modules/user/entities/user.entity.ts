import { BaseAttributeEntity } from "src/common/entities/base.entity"
import { COUNTRY_CODES, USER_ROLES } from "src/common/enums/database.enum"
import { Column, Entity } from "typeorm"

@Entity('user')
export class User extends BaseAttributeEntity {

    @Column({ type: 'varchar', length: 50, })
    first_name: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    last_name: string

    @Column({ type: 'varchar', length: 100, unique: true })
    username: string

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string

    @Column({ type: 'enum', enum: COUNTRY_CODES, length: 3, nullable: true })
    country_code: COUNTRY_CODES

    @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
    mobile_number: string

    @Column({ type: 'varchar', length: 255 })
    password: string

    @Column({ type: 'enum', enum: USER_ROLES })
    role: USER_ROLES

}
