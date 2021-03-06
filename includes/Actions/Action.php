<?php

namespace Flow\Actions;

use Action;
use Article;
use ErrorPageError;
use Flow\Container;
use Flow\Exception\FlowException;
use Flow\View;
use Flow\WorkflowLoaderFactory;
use IContextSource;
use OutputPage;
use Page;
use WikiPage;

class FlowAction extends Action {
	/**
	 * @var string
	 */
	protected $actionName;

	/**
	 * @param Page $page
	 * @param IContextSource $source
	 * @param string $actionName
	 */
	public function __construct( Page $page, IContextSource $source, $actionName ) {
		parent::__construct( $page, $source );
		$this->actionName = $actionName;
	}

	/**
	 * @return string
	 */
	public function getName() {
		return $this->actionName;
	}

	public function show() {
		$this->showForAction( $this->getName() );
	}

	/**
	 * @param string $action
	 * @param OutputPage|null $output
	 * @throws ErrorPageError
	 * @throws FlowException
	 */
	public function showForAction( $action, OutputPage $output = null ) {
		$container = Container::getContainer();
		$occupationController = \FlowHooks::getOccupationController();

		if ( $output === null ) {
			$output = $this->context->getOutput();
		}

		// Check if this is actually a Flow page.
		if ( ! $this->page instanceof WikiPage && ! $this->page instanceof Article ) {
			throw new ErrorPageError( 'nosuchaction', 'flow-action-unsupported' );
		}

		$title = $this->page->getTitle();
		if ( ! $occupationController->isTalkpageOccupied( $title ) ) {
			throw new ErrorPageError( 'nosuchaction', 'flow-action-unsupported' );
		}

		// @todo much of this seems to duplicate BoardContent::getParserOutput
		$view = new View(
			$container['templating'],
			$container['url_generator'],
			$container['lightncandy'],
			$output
		);

		$request = $this->context->getRequest();

		$action = $request->getVal( 'action', 'view' );

		try {
			/** @var WorkflowLoaderFactory $factory */
			$factory = $container['factory.loader.workflow'];
			$loader = $factory->createWorkflowLoader( $title );

			if ( $title->getNamespace() === NS_TOPIC && $loader->getWorkflow()->getType() !== 'topic' ) {
				// @todo better error handling
				throw new FlowException( 'Invalid title: uuid is not a topic' );
			}

			if ( !$loader->getWorkflow()->isNew() ) {
				// Workflow currently exists, make sure a revision also exists
				$occupationController->ensureFlowRevision( $this->page, $loader->getWorkflow() );
			}

			$view->show( $loader, $action );
		} catch( FlowException $e ) {
			$e->setOutput( $output );
			throw $e;
		}
	}
}
