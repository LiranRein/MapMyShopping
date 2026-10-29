import { expect, test } from '@playwright/test';

const prefix = process.env.E2E_PREFIX;

async function createIdentity(page, name) {
  await page.goto('/');
  await page.getByRole('button', { name: 'בואו נתחיל' }).click();
  await page.getByLabel('שם תצוגה').fill(name);
  await page.getByRole('button', { name: 'המשך' }).click();
  await expect(page.getByRole('heading', { name: 'ולאיזה בית?' })).toBeVisible();
}

async function openHousehold(page) {
  await page
    .getByRole('navigation', { name: 'ניווט ראשי' })
    .getByRole('button', { name: 'הבית שלי' })
    .click();
}

test('T-1.13 a new visitor creates a household and stays a manager after reload (AC-1.9)', async ({
  page,
}) => {
  const name = `${prefix}noa`;
  const household = `${prefix}cohen`;
  await createIdentity(page, name);
  await page.getByLabel('שם הבית').fill(household);
  await page.getByRole('button', { name: 'יצירת הבית' }).click();

  await expect(page.getByRole('heading', { name: 'הבית מוכן' })).toBeVisible();
  const card = page.getByRole('region', { name: 'כרטיס הבית' });
  await expect(card).toContainText(name);
  await expect(card).toContainText(household);
  await expect(card).toContainText('מנהל/ת');
  await page.getByRole('button', { name: 'אחר כך, למסך הבית' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'הרשימה של הבית' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'הרשימה של הבית' })).toBeVisible();
  await openHousehold(page);
  await expect(page.getByRole('heading', { level: 1, name: household })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: name })).toContainText('מנהל/ת');
});

test('T-1.14 a second browser joins with the code and both see each other (AC-1.9)', async ({
  browser,
}) => {
  const managerName = `${prefix}dana`;
  const joinerName = `${prefix}avi`;
  const household = `${prefix}levi`;

  const managerContext = await browser.newContext();
  const manager = await managerContext.newPage();
  await createIdentity(manager, managerName);
  await manager.getByLabel('שם הבית').fill(household);
  await manager.getByRole('button', { name: 'יצירת הבית' }).click();
  await manager.getByRole('button', { name: 'להזמנת בני הבית' }).click();
  await manager.getByRole('button', { name: 'יצירת קוד הזמנה' }).click();
  const code = (await manager.getByTestId('invite-code').textContent()).trim();
  expect(code).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);

  const joinerContext = await browser.newContext();
  const joiner = await joinerContext.newPage();
  await createIdentity(joiner, joinerName);
  await joiner.getByRole('radio', { name: /יש לי קוד/ }).click();
  await joiner.getByLabel('קוד (10 תווים)').fill(code.toLowerCase().replace('-', ''));
  await expect(joiner.getByLabel('קוד (10 תווים)')).toHaveValue(code);
  await joiner.getByRole('button', { name: 'הצטרפות' }).click();
  await expect(joiner.getByRole('heading', { name: 'הצטרפת לבית' })).toBeVisible();
  await expect(joiner.getByRole('region', { name: 'כרטיס הבית' })).toContainText('חבר/ה');
  await joiner.getByRole('button', { name: 'למסך הבית' }).click();

  await joiner.reload();
  await openHousehold(joiner);
  await expect(joiner.getByRole('heading', { level: 1, name: household })).toBeVisible();
  await expect(joiner.getByRole('listitem').filter({ hasText: managerName })).toContainText(
    'מנהל/ת',
  );
  await expect(joiner.getByRole('listitem').filter({ hasText: joinerName })).toContainText('חבר/ה');
  await expect(joiner.getByRole('region', { name: 'הזמנה לבית' })).toHaveCount(0);

  await manager.reload();
  await openHousehold(manager);
  await expect(manager.getByRole('listitem').filter({ hasText: joinerName })).toContainText(
    'חבר/ה',
  );
  await expect(manager.getByText('הקוד הוצג - צרו קוד חדש כדי לראות שוב')).toHaveCount(0);

  await managerContext.close();
  await joinerContext.close();
});
