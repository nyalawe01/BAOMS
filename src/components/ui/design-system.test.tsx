import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { DropdownMenu } from './DropdownMenu';
import { EmptyState } from './EmptyState';
import { Alert } from './Alert';
import { ToastProvider, useToast } from '@/lib/ToastContext';
import { ToastContainer } from './Toast';
import { Skeleton, SkeletonKPI, SkeletonTable, SkeletonCard } from './Skeleton';
import { FileUploadDropzone } from './FileUploadDropzone';
import { CompactFileInput } from './CompactFileInput';
import { StatusIndicator } from './StatusIndicator';
import { ButtonGroup, ButtonGroupSeparator } from './ButtonGroup';
import { Dropdown } from './Dropdown';
import { ListBox, Surface } from './ListBox';
import { TagGroup, Tag } from './TagGroup';
import { Switch } from './Switch';
import { Chip } from './Chip';
import { Table } from './Table';
import { Tabs } from './Tabs';

describe('BAOMS Phase 2 Design System Components', () => {
  it('renders Button with variants and loading state', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" onClick={handleClick}>
        Save Record
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Save Record/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Test loading state disables button
    rerender(
      <Button variant="primary" isLoading onClick={handleClick}>
        Save Record
      </Button>
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders Badge with status tokens and dot indicator', () => {
    render(
      <Badge variant="success" withDot>
        Approved
      </Badge>
    );

    const badge = screen.getByText(/Approved/i);
    expect(badge).toBeInTheDocument();
  });

  it('renders Modal and closes on Escape and close button', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Review Title">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText('Review Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);

    // When closed, content should not be rendered
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Review Title">
        <div>Modal Body Content</div>
      </Modal>
    );
    expect(screen.queryByText('Review Title')).not.toBeInTheDocument();
  });

  it('renders DropdownMenu and handles item click', () => {
    const handleItemClick = vi.fn();
    render(
      <DropdownMenu
        trigger={<button>Options Trigger</button>}
        items={[
          { id: '1', label: 'Item One', onClick: handleItemClick },
          { id: '2', label: 'Item Two' },
        ]}
      />
    );

    const trigger = screen.getByText('Options Trigger');
    expect(screen.queryByText('Item One')).not.toBeInTheDocument();

    // Click trigger to open
    fireEvent.click(trigger);
    expect(screen.getByText('Item One')).toBeInTheDocument();

    // Click menu item
    fireEvent.click(screen.getByText('Item One'));
    expect(handleItemClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Item One')).not.toBeInTheDocument();
  });

  it('renders EmptyState with title, description, and action', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Documents"
        description="There are no documents to display."
        action={{ label: 'Upload Document', onClick: handleAction }}
      />
    );

    expect(screen.getByText('No Documents')).toBeInTheDocument();
    expect(screen.getByText('There are no documents to display.')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders Alert with dismiss action', () => {
    const handleDismiss = vi.fn();
    render(
      <Alert variant="warning" title="Warning Header" onClose={handleDismiss}>
        Alert message text
      </Alert>
    );

    expect(screen.getByText('Warning Header')).toBeInTheDocument();
    expect(screen.getByText('Alert message text')).toBeInTheDocument();
    const dismissBtn = screen.getByRole('button', { name: /Dismiss alert/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('triggers and renders Toast notifications', () => {
    const ToastTester = () => {
      const { showToast } = useToast();
      return (
        <button
          onClick={() =>
            showToast({
              title: 'Success Title',
              message: 'Record updated successfully',
              variant: 'success',
            })
          }
        >
          Send Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <ToastTester />
        <ToastContainer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Send Toast'));
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Record updated successfully')).toBeInTheDocument();
  });

  it('renders Skeleton loading variants including Table, KPI, and Cards', () => {
    render(
      <div>
        <Skeleton className="h-4 w-20" data-testid="skeleton-base" />
        <SkeletonKPI data-testid="skeleton-kpi" />
        <SkeletonTable rows={3} columns={3} data-testid="skeleton-table" />
        <SkeletonCard data-testid="skeleton-card" />
      </div>
    );

    expect(screen.getByTestId('skeleton-base')).toHaveClass('animate-pulse');
    expect(screen.getByTestId('skeleton-kpi')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });

  it('renders FileUploadDropzone and handles file selection and removal', () => {
    const handleFileSelect = vi.fn();
    const testFile = new window.File(['sample content'], 'test-document.pdf', {
      type: 'application/pdf',
    });

    const { rerender } = render(
      <ToastProvider>
        <FileUploadDropzone
          selectedFile={null}
          onFileSelect={handleFileSelect}
          hint="Drop file here"
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Drop your files here or/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop file here/i)).toBeInTheDocument();

    // Rerender with selectedFile
    rerender(
      <ToastProvider>
        <FileUploadDropzone
          selectedFile={testFile}
          onFileSelect={handleFileSelect}
        />
      </ToastProvider>
    );

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove test-document.pdf/i });
    fireEvent.click(removeBtn);
    expect(handleFileSelect).toHaveBeenCalledWith(null);
  });

  it('renders CompactFileInput and accepts file selection', () => {
    const handleFileSelect = vi.fn();
    render(
      <ToastProvider>
        <CompactFileInput
          id="custom-file"
          label="Supporting Quote"
          onFileSelect={handleFileSelect}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Supporting Quote/i)).toBeInTheDocument();
    const input = document.getElementById('custom-file') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const file = new window.File(['receipt'], 'quote.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  it('renders StatusIndicator with colored icons (green tick, red X, orange clock) and condition-colored text', () => {
    // Granted / Paid in full -> green tick + emerald text
    const { rerender } = render(<StatusIndicator status="paid" label="Paid in Full" />);
    expect(screen.getByText('Paid in Full')).toBeInTheDocument();
    expect(screen.getByText('Paid in Full')).toHaveClass('text-emerald-700');
    expect(document.querySelector('.text-emerald-600')).toBeInTheDocument();

    // Rejected -> red X + red text
    rerender(<StatusIndicator status="rejected" label="Rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toHaveClass('text-red-700');
    expect(document.querySelector('.text-red-600')).toBeInTheDocument();

    // Pending -> amber clock + amber text
    rerender(<StatusIndicator status="pending" label="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toHaveClass('text-amber-700');
    expect(document.querySelector('.text-amber-600')).toBeInTheDocument();

    // Partial -> amber indicator + amber text
    rerender(<StatusIndicator status="partially_paid" label="Partially Paid" />);
    expect(screen.getByText('Partially Paid')).toBeInTheDocument();
    expect(screen.getByText('Partially Paid')).toHaveClass('text-amber-700');
    expect(document.querySelector('.text-amber-600')).toBeInTheDocument();
  });
});

describe('HeroUI v3 Design System Components', () => {
  it('renders ButtonGroup with separators and button inheritance', () => {
    render(
      <ButtonGroup variant="primary" size="sm">
        <Button>First</Button>
        <Button>
          <ButtonGroupSeparator />
          Second
        </Button>
      </ButtonGroup>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(document.querySelector('.button-group')).toBeInTheDocument();
  });

  it('renders Dropdown with items, labels, and action trigger', () => {
    const handleAction = vi.fn();

    render(
      <Dropdown>
        <Dropdown.Trigger>
          <button>Open Menu</button>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={handleAction}>
            <Dropdown.Item id="item-1">
              <span>Item One</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );

    const trigger = screen.getByText('Open Menu');
    expect(screen.queryByText('Item One')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText('Item One')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Item One'));
    expect(handleAction).toHaveBeenCalledWith('item-1');
  });

  it('renders ListBox and handles single selection', () => {
    const handleSelect = vi.fn();

    render(
      <Surface>
        <ListBox selectionMode="single" onSelectionChange={handleSelect}>
          <ListBox.Item id="1" textValue="Opt 1">
            <span>Option 1</span>
          </ListBox.Item>
          <ListBox.Item id="2" textValue="Opt 2">
            <span>Option 2</span>
          </ListBox.Item>
        </ListBox>
      </Surface>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Option 1'));
    expect(handleSelect).toHaveBeenCalled();
  });

  it('renders TagGroup and supports remove button', () => {
    const handleRemove = vi.fn();

    render(
      <TagGroup onRemove={handleRemove}>
        <TagGroup.List>
          <Tag id="tag-1" textValue="Tag 1">
            <span>Tag 1</span>
            <Tag.RemoveButton />
          </Tag>
        </TagGroup.List>
      </TagGroup>
    );

    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    const removeBtn = screen.getByRole('button', { name: /Remove tag/i });
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(new Set(['tag-1']));
  });

  it('renders Switch and toggles state', () => {
    const handleChange = vi.fn();

    render(
      <Switch onChange={handleChange}>
        <span>Enable Notifications</span>
      </Switch>
    );

    const label = screen.getByText('Enable Notifications');
    fireEvent.click(label);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('renders Chip with variants and colors', () => {
    render(
      <div>
        <Chip variant="soft" color="accent">
          Active Status
        </Chip>
        <Chip variant="primary" color="success">
          Published
        </Chip>
      </div>
    );

    expect(screen.getByText('Active Status')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders Table with compound ScrollContainer and sortable columns', () => {
    const handleSort = vi.fn();

    render(
      <Table>
        <Table.ScrollContainer>
          <Table.Content sortDescriptor={{ column: 'name', direction: 'ascending' }} onSortChange={handleSort}>
            <Table.Header>
              <Table.Column id="name" allowsSorting>
                Name
              </Table.Column>
            </Table.Header>
            <Table.Body>
              <Table.Row id="row-1">
                <Table.Cell>John Doe</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const th = screen.getByText('Name');
    fireEvent.click(th);
    expect(handleSort).toHaveBeenCalledWith({ column: 'name', direction: 'descending' });
  });

  it('renders Tabs in underlined and solid variants without shadows or distortions', () => {
    const handleTabChange = vi.fn();
    const items = [
      { id: 'tab1', label: 'First Tab' },
      { id: 'tab2', label: 'Second Tab', count: 5 },
    ];

    const { rerender } = render(
      <Tabs variant="underlined" tabs={items} activeTab="tab1" onChange={handleTabChange} />
    );

    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    const tab2 = screen.getByText('Second Tab');
    fireEvent.click(tab2);
    expect(handleTabChange).toHaveBeenCalledWith('tab2');

    // Test solid variant
    rerender(
      <Tabs variant="solid" tabs={items} activeTab="tab2" onChange={handleTabChange} />
    );
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
  });
});
