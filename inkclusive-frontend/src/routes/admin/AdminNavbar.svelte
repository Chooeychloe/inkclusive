<script lang="ts">
	import { ChevronDown, Eye, EyeOff, KeyRound, LogOut, Moon, ShieldCheck, Sun } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	let { onLogout }: { onLogout: () => void } = $props();
	let passwordDialogOpen = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordError = $state('');
	let passwordSuccess = $state(false);
	let passwordSaving = $state(false);
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);

	async function changePassword(event: SubmitEvent) {
		event.preventDefault();
		passwordError = '';
		if (newPassword.length < 12) {
			passwordError = 'Use at least 12 characters for the new password.';
			return;
		}
		if (newPassword !== confirmPassword) {
			passwordError = 'The new passwords do not match.';
			return;
		}
		passwordSaving = true;
		try {
			const response = await fetch('/api/admin/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				passwordError = result.detail || 'Could not change the password. Try again.';
				return;
			}
			passwordSuccess = true;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch {
			passwordError = 'Could not reach the admin service. Try again.';
		} finally {
			passwordSaving = false;
		}
	}

	function closePasswordDialog() {
		passwordDialogOpen = false;
		passwordSuccess = false;
		passwordError = '';
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		showCurrentPassword = false;
		showNewPassword = false;
		showConfirmPassword = false;
	}
</script>

<header class="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
	<div class="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
		<div class="flex min-w-0 items-center gap-2.5 sm:gap-3">
			<img src="/inkclusive.svg" alt="" class="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
			<img src="/inkclusive-wordmark.svg" alt="Inkclusive" class="h-5 w-auto max-w-[8rem] shrink-0 object-contain sm:h-6 sm:max-w-[9rem]" />
			<span class="h-7 border-l border-border"></span>
			<span class="text-sm font-semibold text-muted-foreground">Admin workspace</span>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open admin menu">
				<ShieldCheck size={16} class="text-primary" aria-hidden="true" />
				<span>Admin</span>
				<ChevronDown size={15} class="text-muted-foreground" aria-hidden="true" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-64 p-1.5">
				<DropdownMenu.Label class="px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Admin account</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="h-10 cursor-pointer" onclick={toggleMode}>
					{#if $mode === 'dark'}<Sun aria-hidden="true" /><span>Switch to light theme</span>{:else}<Moon aria-hidden="true" /><span>Switch to dark theme</span>{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Item class="h-10 cursor-pointer" onclick={() => { passwordError = ''; passwordSuccess = false; passwordDialogOpen = true; }}>
					<KeyRound aria-hidden="true" /><span>Change password</span>
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="h-10 cursor-pointer text-destructive focus:text-destructive" onclick={onLogout}>
					<LogOut aria-hidden="true" /><span>Sign out</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>

<Dialog.Root bind:open={passwordDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Change admin password</Dialog.Title>
			<Dialog.Description>Choose a new password with at least 12 characters. You will need to sign in again after changing it.</Dialog.Description>
		</Dialog.Header>
		{#if passwordSuccess}
			<div role="status" class="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-foreground">
				<p>Your password has been changed. Your current admin session has been signed out.</p>
				<Button class="w-full" onclick={() => { closePasswordDialog(); onLogout(); }}>Return to sign in</Button>
			</div>
		{:else}
			<form class="space-y-4" onsubmit={changePassword}>
				<div class="space-y-2">
					<label for="current-admin-password" class="text-sm font-medium">Current password</label>
					<div class="relative"><Input id="current-admin-password" type={showCurrentPassword ? 'text' : 'password'} autocomplete="current-password" bind:value={currentPassword} required disabled={passwordSaving} class="pr-11" />
						<button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'} title={showCurrentPassword ? 'Hide password' : 'Show password'} aria-pressed={showCurrentPassword} onclick={() => (showCurrentPassword = !showCurrentPassword)} disabled={passwordSaving}>{#if showCurrentPassword}<EyeOff size={17} aria-hidden="true" />{:else}<Eye size={17} aria-hidden="true" />{/if}</button>
					</div>
				</div>
				<div class="space-y-2">
					<label for="new-admin-password" class="text-sm font-medium">New password</label>
					<div class="relative"><Input id="new-admin-password" type={showNewPassword ? 'text' : 'password'} autocomplete="new-password" bind:value={newPassword} minlength={12} required disabled={passwordSaving} class="pr-11" />
						<button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} title={showNewPassword ? 'Hide password' : 'Show password'} aria-pressed={showNewPassword} onclick={() => (showNewPassword = !showNewPassword)} disabled={passwordSaving}>{#if showNewPassword}<EyeOff size={17} aria-hidden="true" />{:else}<Eye size={17} aria-hidden="true" />{/if}</button>
					</div>
					<p class="text-xs text-muted-foreground">Use at least 12 characters.</p>
				</div>
				<div class="space-y-2">
					<label for="confirm-admin-password" class="text-sm font-medium">Confirm new password</label>
					<div class="relative"><Input id="confirm-admin-password" type={showConfirmPassword ? 'text' : 'password'} autocomplete="new-password" bind:value={confirmPassword} minlength={12} required disabled={passwordSaving} class="pr-11" />
						<button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} title={showConfirmPassword ? 'Hide password' : 'Show password'} aria-pressed={showConfirmPassword} onclick={() => (showConfirmPassword = !showConfirmPassword)} disabled={passwordSaving}>{#if showConfirmPassword}<EyeOff size={17} aria-hidden="true" />{:else}<Eye size={17} aria-hidden="true" />{/if}</button>
					</div>
				</div>
				{#if passwordError}<p role="alert" class="text-sm text-destructive">{passwordError}</p>{/if}
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={closePasswordDialog} disabled={passwordSaving}>Cancel</Button>
					<Button type="submit" disabled={passwordSaving}>{passwordSaving ? 'Saving…' : 'Update password'}</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
