import { BaseAttributeEntity } from "src/common/entities/base.entity";
import { FILE_TYPE, FILE_UPLOAD_STATUS, TABLE_NAME } from "src/common/enums/database.enum";
import { GenAIEntity } from "src/modules/genAI/entities/genai-analysis.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, In, Index, JoinColumn, ManyToMany, ManyToOne } from "typeorm";

@Entity({ name: TABLE_NAME.DOC })
export class DocEntity extends BaseAttributeEntity {

    @Column({ type: 'varchar', nullable: false })
    file_name: string

    @Column({ type: 'varchar', nullable: true, default: "file" })
    actual_file_name: string

    @Column({ type: 'varchar', nullable: false })
    file_path: string // THIS SHOULD BE THE CLOUD STORAGE PATH BUT WE'RE NOT USING ANY CLOUD STORAGE RIGHT NOW SO, LOCAL PATH

    @Column({ type: 'float', nullable: false })
    file_size: number

    @Column({ type: 'enum', nullable: false, enum: FILE_TYPE })
    file_type: FILE_TYPE

    @Index()
    @Column({ type: 'enum', enum: FILE_UPLOAD_STATUS, default: FILE_UPLOAD_STATUS.ACTIVE })
    status: string

    @Index()
    @Column({ type: 'uuid', nullable: false })
    owner: string

    @Index()
    @Column({ type: 'uuid', nullable: false })
    unified_id: string

    @ManyToOne(() => User, user => user.doc_relation, { cascade: true })
    @JoinColumn({ name: 'owner' })
    owner_relation: User

    @ManyToMany(() => GenAIEntity, genAIEntity => genAIEntity.doc_relation, { onDelete: 'CASCADE' })
    genai_relation: User
}