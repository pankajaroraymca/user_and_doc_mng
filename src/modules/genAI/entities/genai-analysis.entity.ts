import { BaseAttributeEntity } from "src/common/entities/base.entity";
import { GENAI_ANALYSIS_STATUS, TABLE_NAME } from "src/common/enums/database.enum";
import { DocEntity } from "src/modules/doc/entities/doc.entity";
import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToOne } from "typeorm";

@Entity({ name: TABLE_NAME.GENAI })
export class GenAIEntity extends BaseAttributeEntity {

    @Index()
    @Column({ type: 'uuid', nullable: false })
    request_id: string

    @Column({ type: 'jsonb', nullable: true })
    request: {}

    @Column({ type: 'jsonb', nullable: true })
    response: {}

    @Index()
    @Column({ type: 'enum', enum: GENAI_ANALYSIS_STATUS, nullable: false })
    status: GENAI_ANALYSIS_STATUS

    @ManyToMany(() => DocEntity, docEntity => docEntity.genai_relation, { cascade: true })
    @JoinColumn({ name: 'request_id', referencedColumnName: 'unified_id' })
    doc_relation: DocEntity[]
}