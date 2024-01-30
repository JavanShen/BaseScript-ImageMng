<template>
    <AForm>
        <AFormItem label="选择数据表">
            <ASelect
                :options="tableList"
                :field-names="{ value: 'id', label: 'name' }"
                v-model:value="currentTableId"
            />
        </AFormItem>
    </AForm>
    <AFlex class="batch-actions" justify="end" align="center">
        <template v-if="selectedImgs.length > 0">
            <AButton
                type="primary"
                :loading="isBatchDownloading"
                style="margin-right: 20px"
                @click="() => batchDownload()"
                >批量下载({{ selectedImgs.length }})</AButton
            >
            <AButton :loading="isZipDownloading" @click="() => zipDownload()"
                >打包下载</AButton
            >
        </template>
        <ACheckbox style="margin-left: 15px" v-model:checked="isCheckedAll"
            >全选</ACheckbox
        >
    </AFlex>
    <ASpace size="large" wrap>
        <template v-if="isFetchFileList">
            <ASkeletonImage v-for="_ in 6" />
        </template>
        <AEmpty v-else-if="fileList.length === 0" description="没有找到图片" />
        <ABadge v-else v-for="item in fileList.filter(file => file.isImg)">
            <template v-if="item.selected" #count>
                <CheckCircleFilled style="color: green; font-size: 19px" />
            </template>
            <AImage
                :src="item.url"
                :height="120"
                :width="120"
                style="object-fit: cover"
                :preview="{
                    visible: item.preview,
                    onVisibleChange: () => {
                        item.preview = false
                    }
                }"
                @error="item.isImg = false"
                @click="item.selected = !item.selected"
            >
                <template #previewMask>
                    <ASpace>
                        <EyeFilled
                            class="image-action"
                            @click.stop="item.preview = true"
                        />
                        <DownloadOutlined
                            class="image-action"
                            @click.stop="downloadUrl(item.url)"
                        />
                    </ASpace>
                </template>
            </AImage>
        </ABadge>
    </ASpace>
</template>

<script lang="ts" setup>
import { bitable, type IAttachmentField } from '@lark-base-open/js-sdk'
import {
    CheckCircleFilled,
    EyeFilled,
    DownloadOutlined
} from '@ant-design/icons-vue'
import { downloadUrl, packDownload } from '../utils/file'
import { message } from 'ant-design-vue'

const base = bitable.base

const { state: tableList } = useAsyncState(async () => {
    return await base.getTableMetaList()
}, [])

const currentTableId = ref<string>()

onBeforeMount(async () => {
    const selection = await base.getSelection()
    currentTableId.value = selection.tableId || ''
})

const {
    state: fileList,
    execute: fetchFileList,
    isLoading: isFetchFileList
} = useAsyncState(
    async (tableId: string = '') => {
        const table = await base.getTableById(tableId)

        const fileFieldList = (await table.getFieldMetaList()).filter(
            item => item.type === 17
        )

        const fileFields = await Promise.all(
            fileFieldList.map(item =>
                table.getFieldById<IAttachmentField>(item.id)
            )
        )

        const fileFieldValues = await Promise.all(
            fileFields.map(async field => ({
                field,
                values: await field.getFieldValueList()
            }))
        )

        const fileList = await Promise.all(
            fileFieldValues.map(
                async field =>
                    await Promise.all(
                        field.values.map(async item => ({
                            recordId: item.record_id,
                            urls: await field.field.getAttachmentUrls(
                                item.record_id || ''
                            )
                        }))
                    )
            )
        )

        return (
            fileList
                .flat()
                .map(item =>
                    item.urls.map(url => ({
                        recordId: item.recordId,
                        url,
                        preview: false,
                        selected: false,
                        isImg: true
                    }))
                )
                .flat() || []
        )
    },
    [],
    {
        immediate: false,
        shallow: false
    }
)
watch(currentTableId, val => {
    isCheckedAll.value = false
    fetchFileList(0, val)
})

const selectedImgs = computed(() =>
    fileList.value.filter(item => item.selected).map(item => item.url)
)

const isCheckedAll = ref(false)
watch(isCheckedAll, val =>
    fileList.value.forEach(item => {
        if (item.isImg) item.selected = val
    })
)

const { execute: batchDownload, isLoading: isBatchDownloading } = useAsyncState(
    async () => {
        await new Promise(res => {
            selectedImgs.value.forEach((item, index) =>
                setTimeout(() => {
                    downloadUrl(item)
                    if (index === selectedImgs.value.length - 1) res('done')
                }, 1000 * index)
            )
        })
    },
    null,
    {
        immediate: false,
        onError: () => {
            message.error('批量下载失败')
        }
    }
)

const { execute: zipDownload, isLoading: isZipDownloading } = useAsyncState(
    async () => {
        await packDownload(selectedImgs.value)
    },
    null,
    {
        immediate: false,
        onError: () => {
            message.error('打包下载失败')
        }
    }
)
</script>

<style scoped>
.batch-actions {
    margin-bottom: 20px;
}

.image-action {
    font-size: 22px;
    cursor: pointer;
}

.image-action:hover {
    opacity: 0.6;
}

.image-action:active {
    opacity: 0.8;
}
</style>
