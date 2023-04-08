# Interface: ObjectDetectionReturnValue

## Properties

### box

• **box**: `Object`

A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `xmax` | `number` |
| `xmin` | `number` |
| `ymax` | `number` |
| `ymin` | `number` |

#### Defined in

[HfInference.ts:501](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L501)

___

### label

• **label**: `string`

The label for the class (model specific) of a detected object.

#### Defined in

[HfInference.ts:510](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L510)

___

### score

• **score**: `number`

A float that represents how likely it is that the detected object belongs to the given class.

#### Defined in

[HfInference.ts:515](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L515)
