<template>
<div>
	<MkButton class="llumlmnx" @click="click()">{{ hpml.interpolate(value.text) }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '../ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	data() {
		return {
			v: 0,
		};
	},
	watch: {
		v() {
			this.hpml.updatePageVar(this.value.name, this.v);
			this.hpml.eval();
		}
	},
	methods: {
		click() {
			this.v = this.v + (this.value.inc || 1);
		}
	}
});
</script>

<style lang="scss" scoped>
.llumlmnx {
	display: inline-block;
	min-width: 300px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
