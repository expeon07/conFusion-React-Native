import React, { Component } from 'react';
import { View, Text, ScrollView, FlatList, Modal, Button, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';


const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites
    }
}

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

function RenderDish(props) {
    const dish = props.dish;

    handleViewRef = ref => this.view = ref;

    // recognize specific gesture
    // moveX, moveY - X,Y positions of recent movement
    // dx,dy - accummulated distance
    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if (dx < -200 ) // right to left pan
            return true;
        else 
            return false;
    };

    const recognizeComment = ({ moveX, moveY, dx, dy}) => {
        if (dx < 200 )
            return true;
        else 
            return false;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: () => {
            this.view.rubberBand(1000)
                // promise
                .then(endState => console.log(endState.finished ? 'finished' : 'cancelled'))
        },
        onPanResponderEnd: (e, gestureState) =>  {
            // add to favorite dish
            if (recognizeDrag(gestureState))
                Alert.alert(
                    'Add to favorites?',
                    'Are you sure you wish to add ' + dish.name + ' to your favorites?',
                    [
                        {
                            text: 'Cancel',
                            onPress: () => console.log('Cancel pressed.'),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: () => props.favorite ? console.log('Already favorite') : props.onPress()
                        }
                    ],
                    { cancelable: false }
                )
            else if (recognizeComment(gestureState))
                props.toggleModal();
            return true;
        }
    });

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url
        }, {
            dialogTitle: 'Share ' + title
        });
    }

    if (dish != null) {
        return(
            <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
                ref={this.handleViewRef}
                {...panResponder.panHandlers} >
                <Card featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }} >
                    <Text style={{margin: 10}}>
                        {dish.description}
                    </Text>
                    <View style={{ justifyContent: 'center', flexDirection: 'row' }}>
                        <Icon style={{ flex: 1 }} 
                            raised 
                            reverse 
                            name={ props.favorite ? 'heart' : 'heart-o' }
                            type='font-awesome'
                            color='#f50'
                            onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()} />
                        <Icon raised 
                            reverse 
                            name='pencil'
                            type='font-awesome'
                            color='#512DA8'
                            onPress={() => props.toggleModal()} />
                        <Icon raised
                            reverse
                            name='share'
                            type='font-awesome'
                            color='#51D2A8'
                            // style={styles.cardItem}
                            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} />
                    </View>
                </Card>
            </Animatable.View>
        );
    }
    else {
        return(<View></View>)
    }
}

function RenderComments(props) {
    const comments = props.comments;

    const renderCommentItem = ({ item, index }) => {
        return(
            <View key={index} style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.comment}</Text>
                <Text style={{fontSize: 12}}>{item.rating} Stars</Text>
                <Text style={{fontSize: 12}}>{'-- ' + item.author + ', ' + item.date}</Text>
            </View>
        );
    }

    return(
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
            <Card title="Comments">
                <FlatList data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()} />
            </Card>
        </Animatable.View>
    );
}

// class component
class Dishdetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rating: 0,
            author: '',
            comment: '',
            showModal: false
        }
    }

    static navigationOptions = {
        title: 'Dish Details'
    };
    
    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal })
    }

    handleComment() {
        console.log(JSON.stringify(this.state));
        this.props.postComment(this.props.dishId, this.state.rating, this.state.author, this.state.comment)
        this.toggleModal();
    }

    resetForm() {
        this.state = {
            rating: 0,
            author: '',
            comment: ''
        }
    }

    render() {
        const dishId = this.props.navigation.getParam('dishId', '')

        return(
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)} 
                    toggleModal={() => this.toggleModal()} />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
                <Modal animationType={'slide'}
                    transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => {this.toggleModal(); this.resetForm()}}
                    onRequestClose={() => {this.toggleModal(); this.resetForm()}} >
                    <View>
                        <Rating type='star'
                            ratingCount={5}
                            imageSize={24}
                            showRating
                            onFinishRating={value => this.setState({ rating: value })} />
                    </View>
                    <View>
                        <Input placeholder='Author'
                            leftIcon={{ type: 'font-awesome', name: 'user-o' }} 
                            onChangeText={value => this.setState({ author: value })} />
                    </View>
                    <View>
                        <Input placeholder='Comment'
                            leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                            onChangeText={value => this.setState({ comment: value })} />
                    </View>
                    <Button title="Submit"
                        color="#512DA8"
                        onPress={() => this.handleComment()} />
                    <Button onPress={() => {this.toggleModal(); this.resetForm()}}
                        color='grey'
                        title='Cancel'/>
                </Modal>
            </ScrollView>
        );
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);